import app from '../index';

function printRoutes(stack: any[], basePath: string = '') {
    stack.forEach((layer: any) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase()).join(', ');
            console.log(`${methods} \t ${basePath}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            let path = layer.regexp.source;
            // Clean up regex path (very basic)
            path = path.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/').replace('(?=\\/|$)', '');
            // Remove trailing flags if any
            if (path.startsWith('/')) {
                printRoutes(layer.handle.stack, basePath + path);
            } else {
                printRoutes(layer.handle.stack, basePath + '/' + path);
            }
        }
    });
}

// Wait for app to be ready if needed, or just print
console.log('--- Active Routes ---');
// Access internal stack - messy but works for debug
printRoutes((app as any)._router.stack);
process.exit(0);
