(function() {
    'use strict'

    /* Script Constants */

    const StorageKey = 'cs_translation_input' // Key for localStorage

    /* Script Variables */

    let ttaInput  = null
    let ttaOutput = null

    /* Initialization */

    // Invoked when the DOM is fully loaded
    ready(() => {
        // Initialize the global HTML element variables
        initializeElements()
        // Restore content from localStorage on page load
        restoreContentFromStorage()
        // Select all text within translation input textarea and focus it
        selectText(ttaInput).focus()
    })

    // Save content to localStorage on page unload
    window.addEventListener('beforeunload', () =>
        localStorage.setItem(StorageKey, ttaInput.innerText)
    )

    // Keyboard shortcuts handler
    document.addEventListener('keydown', ev => keydownHandler(ev))

    /* Functions section */

    /**
     * The keydown event handler (fired when a key is pressed).
     *
     * @param {KeyboardEvent} ev - KeyboardEvent objects describe user interaction with a keyboard.
     */
    function keydownHandler(ev) {
        // Switch input and output content (shortcut ctrl+alt+q)
        if (ev.code === 'KeyQ' && ev.ctrlKey && ev.altKey)
            switchLanguages()

        // Focus textarea
        else if (ev.code === 'KeyQ' && ev.ctrlKey)
            ttaInput.focus()

        // Copy translated text to the clipboard
        else if (ev.code === 'KeyC' && ev.altKey)
            navigator.clipboard.writeText(ttaOutput.innerText)

        // Update the current translation output
        else if (ev.code === 'KeyR' && ev.altKey)
            updateTranslation()
    }

    /* Switch input and output content. */
    function switchLanguages() {
        document.querySelector('#tta_revIcon').click()
        setTimeout(() => {
            // Select all text within translation input textarea
            selectText(ttaInput)
            // Update the current translation output
            updateTranslation()
        }, 0)
    }

    /* Update the current translation output. */
    function updateTranslation() {
        document.querySelector('#tta_regenTransIcon').click()
    }

    /* Initialize the global HTML element variables. */
    function initializeElements() {
        ttaInput  = document.querySelector('#tta_input_ta')
        ttaOutput = document.querySelector('#tta_output_ta')
    }

    /* Restore content from localStorage on page load. */
    function restoreContentFromStorage() {
        const savedText = localStorage.getItem(StorageKey)

        if (savedText)
            ttaInput.innerText = savedText
    }

    /**
     * Select all text within a specified HTML text element.
     *
     * @param {?HTMLElement} element - HTML text element whose content is to be selected.
     *
     * @returns {?HTMLElement}
     * @author Nova Bella 🌸
     */
    function selectText(element) {
        // Nothing to do
        if (!element)
            return null

        // Get the current selection and create a new range object
        const selection = window.getSelection()
        const range = document.createRange()

        // Prepare the contents of the provided element
        range.selectNodeContents(element)
        selection.removeAllRanges()

        // Add the new range to the selection
        selection.addRange(range)

        return element
    }

    /**
     * Handler function to execute after the DOM is ready for the ready() function.
     *
     * @callback handlerCallback
     */

    /**
     * Specify a handler function to execute when the DOM is fully loaded.
     *
     * @param {handlerCallback} handler - Handler function to execute after the DOM is ready.
     */
    function ready(handler) {
        if (document.readyState !== 'loading')
            handler()
        else
            document.addEventListener('DOMContentLoaded', handler)
    }
})()
