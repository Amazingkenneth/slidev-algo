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

                // Redirect stdout to a variable and ensure isolation
                const result = await pyodide.runPythonAsync(`
                    import sys
                    from io import StringIO

                    # Create a new StringIO object for this execution
                    output_buffer = StringIO()
                    sys.stdout = output_buffer

                    # Run the user code
                    exec(${JSON.stringify(code)})

                    # Get the output and reset stdout
                    output = output_buffer.getvalue()
                    sys.stdout = sys.__stdout__

                    output
                `);

                // Wrap the result in a <pre> tag to preserve newlines
                const formattedResult = `<pre>${result}</pre>`;

                return {
                    html: formattedResult
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
