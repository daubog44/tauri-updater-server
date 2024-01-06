export default defineNitroPlugin((nitro) => {
    nitro.hooks.hookOnce("close", async () => {
        // Will run when nitro is being closed
        console.log("Good bye!");
    });

    nitro.hooks.hook("error", async (error, { event }) => {
        console.error(`${event.path} Application error:`, error)
    });
})