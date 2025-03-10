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
    const focusDisplay = document.getElementById('focusDisplay');
    const focusModal = document.getElementById('focusModal');
    const focusInput = document.getElementById('focusInput');
    const saveFocusButton = document.getElementById('saveFocus');
    const skipFocusButton = document.getElementById('skipFocus');

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

    // Add variables to track current focus and focus state
    let currentFocus = '';
    let focusSkipped = false;
    // Add a variable to track if a work session has been started
    let workSessionStarted = false;
    const motivationalQuote = "In a world of distraction, focusing is a superpower.";

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
        updateFocusDisplay();
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
        
        // If we're in work mode and starting a new session, show the focus modal
        if (currentMode === 'work' && !startTime) {
            showFocusModal();
            return;
        }
        
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
        timer = setInterval(updateTimerDisplay, 100); // Update every 100ms for smoother countdown
    }

    // Function to update the timer display
    function updateTimerDisplay() {
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
    }

    // Function to start the timer after the modal has been handled
    function startTimerAfterModal() {
        isRunning = true;
        updateStartPauseButton();
        
        // Set the start time and total duration
        totalDuration = calculateTotalSeconds() * 1000;
        startTime = Date.now();
        elapsedPauseTime = 0;
        
        // Clear any existing interval
        if (timer) clearInterval(timer);
        
        // Use setInterval with a short interval for more frequent updates
        timer = setInterval(updateTimerDisplay, 100);
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

    // Function to show the focus modal
    function showFocusModal() {
        focusInput.value = currentFocus;
        focusModal.style.display = 'flex';
        focusInput.focus();
    }
    
    // Function to hide the focus modal
    function hideFocusModal() {
        focusModal.style.display = 'none';
    }
    
    // Function to update the focus display
    function updateFocusDisplay() {
        if (currentMode === 'work' && workSessionStarted) {
            if (focusSkipped) {
                // Show motivational quote when focus was skipped
                focusDisplay.textContent = motivationalQuote;
            } else if (currentFocus) {
                // Show the user's focus
                focusDisplay.textContent = `Currently focusing on: ${currentFocus}`;
            } else {
                // Hide if no focus and not skipped (should not happen in normal flow)
                focusDisplay.textContent = '';
                focusDisplay.style.display = 'none';
                return;
            }
            focusDisplay.style.display = 'block';
        } else {
            // Hide focus display during breaks or before first work session
            focusDisplay.textContent = '';
            focusDisplay.style.display = 'none';
        }
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

    // Event listeners for the focus modal
    saveFocusButton.addEventListener('click', () => {
        currentFocus = focusInput.value.trim();
        focusSkipped = false; // User provided a focus
        workSessionStarted = true; // Mark that a work session has started
        hideFocusModal();
        updateFocusDisplay();
        
        // Start the timer directly without showing the modal again
        startTimerAfterModal();
    });
    
    skipFocusButton.addEventListener('click', () => {
        focusSkipped = true; // User skipped providing a focus
        workSessionStarted = true; // Mark that a work session has started
        hideFocusModal();
        updateFocusDisplay();
        
        // Start the timer directly without showing the modal again
        startTimerAfterModal();
    });
    
    // Allow pressing Enter in the input field to save
    focusInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveFocusButton.click();
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

    // Initialize focus display to be empty at startup
    focusDisplay.style.display = 'none';
}); 