package smartclide.perftestgen.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.apache.logging.log4j.util.Strings;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import smartclide.perftestgen.util.StreamGobbler;

@RestController
public class PerfTestGenController {
	public static final Logger log = LoggerFactory.getLogger(PerfTestGenController.class);

	@CrossOrigin("*")
	@PostMapping("/generateTest")
	public ResponseEntity<String> generateTests(@RequestParam("file") MultipartFile apiDescriptor) {
		try {
			File destFile = saveToDisk(apiDescriptor);
			File tmpDir = destFile.getParentFile();

			generateTestScript(destFile, tmpDir);

			String scriptContent = loadGeneratedScript(tmpDir);

			deleteGeneratedContent(tmpDir);

			return ResponseEntity.ok()
					.contentType(MediaType.parseMediaType("application/octet-stream"))
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"script.js\"")
					.body(scriptContent);

		} catch (Exception e) {
			log.error("Error generating test script", e);
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
					"There was a problem generating the test script: ", e);
		}
	}

	private void deleteGeneratedContent(File containingFolder) throws IOException {
		try {
			log.info("Deleting generated files...");
			FileUtils.forceDelete(containingFolder);
		} catch (Exception e) {
			log.warn("Failed deleting generated content, marked for deletion at VM shutdown. Exception: {}", e);
			FileUtils.forceDeleteOnExit(containingFolder);
		}

	}

	private String loadGeneratedScript(File destFolder) throws IOException {
		log.info("reading generated content");
		return Files.readString(Paths.get(destFolder.getPath(), "script.js"));
	}

	private void generateTestScript(File originFile, File destFolder) throws Exception {
		executeSystemCommand("java",
				"-jar", 
				"openapi-generator-cli-6.2.0.jar", 
				"generate", 
				"-i", originFile.getAbsolutePath(), 
				"-g", "k6", 
				"-o", destFolder.getAbsolutePath());
	}

	private File saveToDisk(MultipartFile requestContent) throws IllegalStateException, IOException {
		File p = createTempFile(requestContent.getOriginalFilename());
		log.info("saving data to disk on file {}", p);
		requestContent.transferTo(p.toPath());
		return p;

	}

	private File createTempFile(String originalFileName) {
		String fileName = Strings.isBlank(originalFileName) ? "descriptor" : originalFileName;
		File destFile = new File(getTempDir(), fileName);
		destFile.deleteOnExit();
		log.debug("created temp file {}", destFile.getAbsolutePath());
		return destFile;
	}

	private File getTempDir() {
		File tmpDir = new File("tmp", UUID.randomUUID().toString());
		if (!tmpDir.exists()) {
			tmpDir.mkdirs();
			tmpDir.deleteOnExit();
			log.debug("create temp dir {}", tmpDir.getAbsolutePath());
		}
		return tmpDir;
	}

	private void executeSystemCommand(String... command) throws Exception {
		log.info("executing creation task...");
		ProcessBuilder builder = new ProcessBuilder();
		builder.command(command);
		Process process = builder.start();
		ExecutorService cmdExec = Executors.newSingleThreadExecutor();
		cmdExec.invokeAll(List.of(new StreamGobbler(process.getInputStream(), System.out::println),
				new StreamGobbler(process.getErrorStream(), System.out::println)));
		int exitCode = process.waitFor();
		assert exitCode == 0;
		cmdExec.shutdown();
		cmdExec.awaitTermination(10, TimeUnit.SECONDS);
		log.info("creation task completed");
	}
}
