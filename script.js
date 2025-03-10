document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const statusDisplay = document.getElementById('status');
    const startPauseButton = document.getElementById('startPause');
    const resetButton = document.getElementById('reset');
    const workTimeInput = document.getElementById('workTime');
    const shortBreakInput = document.getElementById('shortBreak');
    const longBreakInput = document.getElementById('longBreak');
    const cyclesInput = document.getElementById('cycles');
    const completedCountDisplay = document.getElementById('completedCount');
    const totalCyclesDisplay = document.getElementById('totalCycles');
    const toggleModeButton = document.getElementById('toggleMode');
    const addFiveMinutesButton = document.getElementById('addFiveMinutes');

    // Timer variables
    let timer;
    let minutes;
    let seconds;
    let isRunning = false;
    let currentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
    let completedPomodoros = 0;
    let totalCycles = 4;
    const originalTitle = document.title;
    
    // Time tracking variables
    let startTime = null;
    let elapsedPauseTime = 0;
    let pauseStartTime = null;
    let totalDuration = 0;

    // Audio notification
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');

    // Initialize the timer
    function initializeTimer() {
        minutes = parseInt(workTimeInput.value);
        seconds = 0;
        currentMode = 'work';
        toggleModeButton.textContent = 'Switch to Rest';
        toggleModeButton.style.backgroundColor = '#9b59b6'; // Purple color for switching to rest
        updateDisplay();
        updateStatus();
        updateStartPauseButton();
        updateTabTitle();
    }

    // Update the timer display
    function updateDisplay() {
        minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        secondsDisplay.textContent = seconds.toString().padStart(2, '0');
        updateTabTitle();
    }

    // Update the browser tab title
    function updateTabTitle() {
        const modePrefix = currentMode === 'work' ? '🔴' : currentMode === 'shortBreak' ? '🟢' : '🔵';
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (isRunning) {
            document.title = `${modePrefix} ${timeString} - Pomodoro Timer`;
        } else {
            document.title = `⏸️ ${timeString} - Pomodoro Timer`;
        }
    }

    // Update the status display
    function updateStatus() {
        switch (currentMode) {
            case 'work':
                statusDisplay.textContent = 'Work Time';
                document.body.classList.remove('short-break-mode', 'long-break-mode');
                document.body.classList.add('work-mode');
                break;
            case 'shortBreak':
                statusDisplay.textContent = 'Short Break';
                document.body.classList.remove('work-mode', 'long-break-mode');
                document.body.classList.add('short-break-mode');
                break;
            case 'longBreak':
                statusDisplay.textContent = 'Long Break';
                document.body.classList.remove('work-mode', 'short-break-mode');
                document.body.classList.add('long-break-mode');
                break;
        }
        
        completedCountDisplay.textContent = completedPomodoros.toString();
        totalCyclesDisplay.textContent = totalCycles.toString();
        updateTabTitle();
    }

    // Update the Start/Pause button appearance
    function updateStartPauseButton() {
        if (isRunning) {
            startPauseButton.textContent = 'Pause';
            startPauseButton.style.backgroundColor = 'var(--warning)';
            // Enable the +5 Minutes button when timer is running
            addFiveMinutesButton.disabled = false;
            addFiveMinutesButton.style.backgroundColor = 'var(--primary-light)';
            addFiveMinutesButton.style.opacity = '1';
            addFiveMinutesButton.style.cursor = 'pointer';
        } else {
            startPauseButton.textContent = 'Start';
            startPauseButton.style.backgroundColor = 'var(--success)';
            // Disable and grey out the +5 Minutes button when timer is not running
            addFiveMinutesButton.disabled = true;
            addFiveMinutesButton.style.backgroundColor = '#ccc';
            addFiveMinutesButton.style.opacity = '0.6';
            addFiveMinutesButton.style.cursor = 'not-allowed';
        }
        updateTabTitle();
    }

    // Handle Start/Pause button click
    function handleStartPause() {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }

    // Calculate total time in seconds
    function calculateTotalSeconds() {
        return minutes * 60 + seconds;
    }

    // Convert total seconds to minutes and seconds
    function updateTimeFromSeconds(totalSeconds) {
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;
    }

    // Start the timer
    function startTimer() {
        if (isRunning) return;
        
        isRunning = true;
        updateStartPauseButton();
        
        // Set the start time and total duration
        if (!startTime) {
            totalDuration = calculateTotalSeconds() * 1000;
            startTime = Date.now();
            elapsedPauseTime = 0;
        } else if (pauseStartTime) {
            // If resuming from pause, add the pause duration to elapsed pause time
            elapsedPauseTime += (Date.now() - pauseStartTime);
            pauseStartTime = null;
        }
        
        // Clear any existing interval
        if (timer) clearInterval(timer);
        
        // Use setInterval with a short interval for more frequent updates
        timer = setInterval(() => {
            // Calculate elapsed time considering pauses
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime - elapsedPauseTime;
            const remainingTime = Math.max(0, totalDuration - elapsedTime);
            
            // Convert to seconds for display
            const remainingSeconds = Math.ceil(remainingTime / 1000);
            updateTimeFromSeconds(remainingSeconds);
            updateDisplay();
            
            // Check if timer has completed
            if (remainingSeconds <= 0) {
                // Timer completed
                clearInterval(timer);
                audio.play();
                isRunning = false;
                startTime = null;
                pauseStartTime = null;
                elapsedPauseTime = 0;
                
                // Switch modes
                if (currentMode === 'work') {
                    completedPomodoros++;
                    
                    if (completedPomodoros % totalCycles === 0) {
                        // Time for a long break
                        currentMode = 'longBreak';
                        updateTimeFromSeconds(parseInt(longBreakInput.value) * 60);
                    } else {
                        // Time for a short break
                        currentMode = 'shortBreak';
                        updateTimeFromSeconds(parseInt(shortBreakInput.value) * 60);
                    }
                } else {
                    // Back to work
                    currentMode = 'work';
                    updateTimeFromSeconds(parseInt(workTimeInput.value) * 60);
                }
                
                updateStatus();
                updateStartPauseButton();
                
                // Auto-start the next timer
                startTimer();
            }
        }, 100); // Update every 100ms for smoother countdown
    }

    // Pause the timer
    function pauseTimer() {
        if (!isRunning) return;
        
        isRunning = false;
        clearInterval(timer);
        pauseStartTime = Date.now();
        updateStartPauseButton();
    }

    // Reset the timer
    function resetTimer() {
        pauseTimer();
        
        // Keep the current mode but reset the timer
        if (currentMode === 'work') {
            minutes = parseInt(workTimeInput.value);
        } else if (currentMode === 'shortBreak') {
            minutes = parseInt(shortBreakInput.value);
        } else if (currentMode === 'longBreak') {
            minutes = parseInt(longBreakInput.value);
        }
        
        seconds = 0;
        startTime = null;
        pauseStartTime = null;
        elapsedPauseTime = 0;
        updateDisplay();
        updateStatus();
        
        // Only reset the completed pomodoros count, not the mode
        completedPomodoros = 0;
        completedCountDisplay.textContent = completedPomodoros.toString();
    }

    // Define the toggleMode function after other timer functions
    function toggleMode() {
        pauseTimer();
        startTime = null;
        pauseStartTime = null;
        elapsedPauseTime = 0;
        
        if (currentMode === 'work') {
            currentMode = 'shortBreak';
            minutes = parseInt(shortBreakInput.value);
            seconds = 0;
            toggleModeButton.textContent = 'Switch to Work';
            toggleModeButton.style.backgroundColor = '#16a085'; // Teal color for switching to work
        } else {
            currentMode = 'work';
            minutes = parseInt(workTimeInput.value);
            seconds = 0;
            toggleModeButton.textContent = 'Switch to Rest';
            toggleModeButton.style.backgroundColor = 'var(--primary)';
        }
        updateDisplay();
        updateStatus();
    }

    // Add this function to handle adding 5 minutes
    function addFiveMinutes() {
        if (!isRunning) return;
        
        // Add 5 minutes (300 seconds) to the current timer
        const currentTotalSeconds = calculateTotalSeconds();
        const newTotalSeconds = currentTotalSeconds + 300;
        
        // Update the display
        updateTimeFromSeconds(newTotalSeconds);
        updateDisplay();
        
        // Update the total duration for the timer calculation
        totalDuration += 300 * 1000; // Add 5 minutes in milliseconds
    }

    // Event listeners
    startPauseButton.addEventListener('click', handleStartPause);
    resetButton.addEventListener('click', resetTimer);
    toggleModeButton.addEventListener('click', toggleMode);
    addFiveMinutesButton.addEventListener('click', addFiveMinutes);
    
    // Settings event listeners
    workTimeInput.addEventListener('change', () => {
        if (currentMode === 'work' && !isRunning) {
            minutes = parseInt(workTimeInput.value);
            updateDisplay();
        }
    });
    
    shortBreakInput.addEventListener('change', () => {
        if (currentMode === 'shortBreak' && !isRunning) {
            minutes = parseInt(shortBreakInput.value);
            updateDisplay();
        }
    });
    
    longBreakInput.addEventListener('change', () => {
        if (currentMode === 'longBreak' && !isRunning) {
            minutes = parseInt(longBreakInput.value);
            updateDisplay();
        }
    });
    
    cyclesInput.addEventListener('change', () => {
        totalCycles = parseInt(cyclesInput.value);
        totalCyclesDisplay.textContent = totalCycles.toString();
    });

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        // When tab becomes visible again, update the display
        if (!document.hidden && isRunning) {
            // No need to do anything special - the interval will continue running
            updateDisplay();
        }
    });

    // Initialize
    totalCycles = parseInt(cyclesInput.value);
    initializeTimer();
    // Initially disable the +5 Minutes button since timer starts paused
    addFiveMinutesButton.disabled = true;
    addFiveMinutesButton.style.backgroundColor = '#ccc';
    addFiveMinutesButton.style.opacity = '0.6';
    addFiveMinutesButton.style.cursor = 'not-allowed';
}); 