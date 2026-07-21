export function setupProcessErrorHandlers() {
    process.on('uncaughtException', (err) => {
        console.error('Uncaught Exception! Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    });


    process.on('unhandledRejection', (err: Error) => {
        console.error('Unhandled Rejection! Shutting down...');
        console.error(err.name, err.message);
        process.exit(1);
    });
}