FROM eclipse-temurin:11-alpine
VOLUME /tmp
COPY target/perftest-gen-service-0.0.1-SNAPSHOT.jar app.jar
COPY openapi-generator-cli-6.2.0.jar openapi-generator-cli-6.2.0.jar
ENTRYPOINT ["java","-jar","/app.jar"]