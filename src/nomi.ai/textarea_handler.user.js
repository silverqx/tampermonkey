(function() {
    'use strict'

    // Monitor DOM changes to catch when the textarea is added
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const textarea = document.querySelector('textarea[aria-label="Chat Input"]')
                if (textarea) {
                    observer.disconnect() // Stop observing once the textarea is found
                    overrideTextareaValue(textarea)
                }
            }
        }
    })

    // Start observing for DOM changes
    observer.observe(document.documentElement, { childList: true, subtree: true })

    function overrideTextareaValue(textarea) {
        // Store the original value
        let currentValue = textarea.value

        // Override the getter and setter
        Object.defineProperty(textarea, 'value', {
            get() {
                console.log('Getter called, current value:', currentValue)
                return currentValue
            },
            set(newValue) {
                console.log('Setter called, new value:', newValue)
                currentValue = newValue

                // React to value change
                handleValueChange(newValue)
            }
        })

        console.log('Textarea value overridden successfully!')
    }

    function handleValueChange(value) {
        console.log('Value changed to:', value)
        // Add your custom logic here
    }
})()
