import { defineCodeRunnersSetup } from '@slidev/types';

let pyodideReadyPromise = null;

async function loadPyodideAndPackages() {
    if (!pyodideReadyPromise) {
        pyodideReadyPromise = new Promise(async (resolve, reject) => {
            try {
                const pyodide = await loadPyodide({
                    indexURL: "https://cdn.jsdelivr.net/npm/pyodide",
                });
                await pyodide.loadPackage(['micropip']);
                resolve(pyodide);
            } catch (error) {
                reject(error);
            }
        });
    }
    return pyodideReadyPromise;
}

export default defineCodeRunnersSetup(() => {
    return {
        async python(code, ctx) {
            try {
                const pyodide = await loadPyodideAndPackages();

                // Redirect stdout to a variable
                pyodide.runPython(`
                    import sys
                    from io import StringIO
                    sys.stdout = StringIO()
                `);

                // Run the user code
                await pyodide.runPythonAsync(code);

                // Get the stdout content
                const output = pyodide.runPython('sys.stdout.getvalue()');

                return {
                    text: output
                };
            } catch (error) {
                return {
                    text: `Error: ${error.message}`
                };
            }
        },
        html(code, ctx) {
            return {
                html: sanitizeHtml(code)
            };
        },
        // other languages can be added here
    };
});
