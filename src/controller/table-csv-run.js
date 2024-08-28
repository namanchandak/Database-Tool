const { exec } = require('child_process');
const path = require('path');

function runPythonScript() {
    // Corrected path to your Python script
    const scriptPath = path.join('D:', 'code', 'Dice', 'DB tool', 'src', 'db script', 'table-csv.py');

    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error}`);
            return;
        }
        
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        
        console.log(`stdout: ${stdout}`);
    });
}

// Run the function
runPythonScript();
