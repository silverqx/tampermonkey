// ==UserScript==
// @name         Nomi.ai - Chat textarea Override
// @namespace    https://beta.nomi.ai/
// @version      0.1.0
// @description  Hook/subscribe into textarea value before any other script runs
// @author       Silver Zachara <silver.zachara@gmail.com>
// @match        https://beta.nomi.ai/app
// @match        https://beta.nomi.ai/nomis
// @match        https://beta.nomi.ai/nomis/*
// @match        https://beta.nomi.ai/profile/*
// @icon         https://www.google.com/s2/favicons?domain=nomi.ai&sz=64
// @grant        none
// @run-at       document-start
// @require      file:///E:/code/js/tampermonkey/nomi.ai/textarea_handler.user.js
// ==/UserScript==

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
