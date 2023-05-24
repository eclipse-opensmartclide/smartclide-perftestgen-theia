package smartclide.perftestgen.util;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.Callable;
import java.util.function.Consumer;

public class StreamGobbler implements Callable<Void> {
    private InputStream inputStream;
    private Consumer<String> consumer;

    public StreamGobbler(InputStream inputStream, Consumer<String> consumer) {
        this.inputStream = inputStream;
        this.consumer = consumer;
    }

	@Override
	public Void call() throws Exception {
		new BufferedReader(new InputStreamReader(inputStream)).lines()
		.forEach(consumer);
		return null;
	}
}