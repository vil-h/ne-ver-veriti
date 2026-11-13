export default {
 base: './',
 server: {watch: {usePolling:true}},
 build: {target:'es2022',chunkSizeWarningLimit:1800,rollupOptions:{output:{manualChunks(id){if(id.includes('@babylonjs'))return 'babylon';}}}}
};
