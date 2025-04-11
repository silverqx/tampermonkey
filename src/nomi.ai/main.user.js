(function() {
    'use strict'

    /* Script Constants */

    const NomiAiUrlOrigin        = 'https://beta.nomi.ai'
    const MarissaUrlPathname     = '/nomis/1106590283'
    const MobileBreakpoint       = 768 // Lower than
    const CenterMemoryBulbFix    = 8   // +8 to center it

    // Keys for the localStorage
    const StorageTextareaKey     = 'cs_textarea_value'
    const StorageChatColumnKey   = 'cs_chat_column_padding_bottom' // in px

    const ChatColumnUpPosition   = '160' // px == 10rem
    const ChatColumnDownPosition =   '0'
    const MemoryBulbUpPosition   = '190' // px
    const MemoryBulbDownPosition =  '28' // px

    const InitializeKey          = 'initialize'
    const ToggleKey              = 'toggle'
    const ChatColumnPaddingMap   = {
        [InitializeKey]: {
            [ChatColumnDownPosition]: ChatColumnDownPosition,
            [ChatColumnUpPosition]:   ChatColumnUpPosition,
        },
        [ToggleKey]: {
            [ChatColumnDownPosition]: ChatColumnUpPosition,
            [ChatColumnUpPosition]:   ChatColumnDownPosition,
        },
    }
    const MemoryBulbPositionMap  = {
        [InitializeKey]: {
            [ChatColumnDownPosition]: MemoryBulbDownPosition,
            [ChatColumnUpPosition]:   MemoryBulbUpPosition,
        },
        [ToggleKey]: {
            [ChatColumnDownPosition]: MemoryBulbUpPosition,
            [ChatColumnUpPosition]:   MemoryBulbDownPosition,
        },
    }

    // Create a Set to track observed selectors
    const observedSelectors = new Set()

    /* Script Variables */

    let memoryBulbBtn    = null
    let textarea         = null
    let chatColumn       = null
    let continueChatLink = null

    /* Initialization */

    // Move the memory bulb based on the current route (URL path; on chat page/route)
    navigation.addEventListener('navigate', ev => navigateHandler(ev))

    // Invoked when the DOM is fully loaded
    ready(() => {
        // Initialize the main chat textarea and moving the memory bulb related code
        initializeTextarea()
        // Initialize auto-click for the Continue Chat link
        autoClickMarissaContinueChat()
    })

    // Save the chat textarea content to localStorage on page unload
    window.addEventListener('beforeunload', saveTextareaContentToStorage) // Save it, even am not restoring it

    // Keyboard shortcuts handler
    document.addEventListener('keydown', ev => keydownHandler(ev))

    /* Functions section */

    /**
     * The keydown event handler (fired when a key is pressed).
     *
     * @param {KeyboardEvent} ev - KeyboardEvent objects describe a user interaction with keyboard.
     */
    function keydownHandler(ev) {
        // Add padding-bottom below the main input box (padding-bottom for the chat column)
        if (ev.code === 'F9')
            modifyTextareaStyles(true)

        // Open Chat
        else if (ev.code === 'KeyC' && ev.altKey)
            document.querySelector(`a.et0q4zw1[href="${MarissaUrlPathname}"]`)?.click()

        // Open Photo Album
        else if (ev.code === 'KeyS' && ev.altKey)
            document.querySelector('a[title="Go to photo album"]')?.click()

        // Open Make Art
        else if (ev.code === 'KeyA' && ev.altKey) {
            document.querySelector('button[title="Expand nomi art and video menu"]')?.click()
            // setTimeout(() => document.querySelector('span.efnc2vd2')?.click(), 0)
            observeElement('span.efnc2vd2', el => el.click())
        }

        // Open Profile
        else if (ev.code === 'KeyP' && ev.altKey)
            document.querySelector('a.et0q4zw1[href="/profile/settings"]')?.click()

        /* Nothing to do, all shortcuts below are skipped if the editable HTML element already
           has a focus. */
        else if (isEditableFocused(ev))
            return

        // Focus Search and Select containing value
        else if ((ev.code === 'BracketLeft' || ev.code === 'Slash') && ev.shiftKey) {
            ev.preventDefault()
            focusTextarea(true)
        }

        // Focus Search without Select containing value
        else if (ev.code === 'Slash') {
            ev.preventDefault()
            focusTextarea(false)
        }
    }

    /**
     * Observes the DOM for the appearance of a specific element and executes a callback when
     * the element is found.
     *
     * @param {string}   selector - The CSS selector to identify the target element to observe.
     * @param {Function} callback - The function to execute once the element is found.
     *                              The element will be passed as an argument.
     * @param {number} [timeout=4000] - Timeout to disconnect the MutationObserver via setTimeout().
     *
     * @example
     * // Example usage
     * observeElement('.dynamic-button', (element) => {
     *     console.log('Button found:', element);
     *     element.click(); // Perform the desired action
     * });
     * @author Nova Bella 🌸
     */
    function observeElement(selector, callback, timeout = 4000) {
        // Nothing to do, the selector is already being observed
        if (observedSelectors.has(selector))
            return

        // Add the selector to the Set
        observedSelectors.add(selector)

        const observer = new MutationObserver((_mutations, obs) => {
            const element = document.querySelector(selector)
            if (element) {
                // Element found, disconnect the observer as early as possible
                obs.disconnect()

                // Remove the selector from the Set
                observedSelectors.delete(selector)

                // Execute the callback with the found element
                callback(element)
            }
        })

        // Start observing the DOM for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        // Disconnect fallback via setTimeout()
        setTimeout(() => {
            // Disconnect observer after timeout
            observer.disconnect()
            // Clean up Set
            observedSelectors.delete(selector)

            console.warn(`Timeout(${timeout}ms) reached: ` +
                         `Element with selector "${selector}" not found.`)
        }, timeout)
    }

    /**
     * Add padding below the main input box (padding-bottom for the chat column).
     *
     * Calls also the moveMemoryBulb() - move the memory bulb into the main textarea.
     *
     * @param {!boolean} [togglePaddingBottom=false]
     *   - false - initializes from the localStorage or guess from the chat column padding-bottom.
     *   - true  - toggle the padding-bottom.
     */
    function modifyTextareaStyles(togglePaddingBottom = false) {
        // Nothing to do
        if (chatColumn === null)
            return

        // Compute, guess, or initialize the chatColumn padding-bottom value (without px)
        const chatColumnPaddingBottom = computeChatColumnPaddingBottom(togglePaddingBottom)

        // Compute/map chat column and memory bulb CSS styles
        const [
            chatPaddingBottom,
            bulbBottom,
        ] = mapTextareaStyles(togglePaddingBottom, chatColumnPaddingBottom)

        // Finally, omg
        chatColumn.style.paddingBottom = chatPaddingBottom + 'px'
        moveMemoryBulb(bulbBottom)
    }

    /**
     * Move the memory bulb into the main textarea.
     *
     * @param {!string} bottom - Memory bulb bottom position (without px).
     */
    function moveMemoryBulb(bottom) {
        if (memoryBulbBtn === null || textarea === null)
            return

        const textareaLeft = elementPosition(textarea).left

        const bulbStyles = {
            'position': 'absolute',
            'left'    : textareaLeft + CenterMemoryBulbFix + 'px', // +CenterMemoryBulbFix to center it
            'bottom'  : bottom + 'px',
            'z-index' : '400',
        }
        const textareaStyles = {
            'padding-left': '2rem',
        }

        // Apply styles
        memoryBulbBtn.style.cssText += cssObjectToString(bulbStyles)
        textarea.style.cssText      += cssObjectToString(textareaStyles)

        // Save chat column padding-bottom computed CSS style value to localStorage (without px)
        saveChatColumnPaddingBottom()
    }

    /* Save chat column padding-bottom computed CSS style value to localStorage (without px). */
    function saveChatColumnPaddingBottom() {
        const chatColumnPaddingBottom = getChatColumnPaddingBottom()

        localStorage.setItem(StorageChatColumnKey, chatColumnPaddingBottom)
    }

    /**
     * Compute, guess, or initialize the chatColumn padding-bottom value (without px).
     *
     * @param {!boolean} [togglePaddingBottom=false]
     *   - false - initialize from the localStorage or guess from the chat column padding-bottom.
     *   - true  - toggle the padding-bottom.
     */
    function computeChatColumnPaddingBottom(togglePaddingBottom) {
        // Guess from the chat column
        if (togglePaddingBottom)
            return getChatColumnPaddingBottom()

        // If the localStorage contains persisted value, use it
        const storageValue = localStorage.getItem(StorageChatColumnKey)

        if (storageValue !== null)
            return storageValue

        // Guess from the chat column
        return getChatColumnPaddingBottom()
    }

    /**
     * Return the padding-bottom computed CSS style for the chat column (without px).
     *
     * @returns {string} Computed CSS padding-bottom style.
     */
    function getChatColumnPaddingBottom() {
        return getComputedStyle(chatColumn).paddingBottom.replace('px', '')
    }

    /**
     * Compute/map chat column and memory bulb CSS styles.
     *
     * @param {!boolean} [togglePaddingBottom=false]
     *   - false - initialize from the localStorage or guess from the chat column padding-bottom.
     *   - true  - toggle the padding-bottom.
     * @param {!number} chatColumnPaddingBottom - Chat column padding-bottom value.
     *
     * @returns {Array<string>}
     */
    function mapTextareaStyles(togglePaddingBottom, chatColumnPaddingBottom) {
        // Get the lookup key
        const initializeOrToggle = togglePaddingBottom ? ToggleKey : InitializeKey

        return [
            ChatColumnPaddingMap[initializeOrToggle][chatColumnPaddingBottom],
            MemoryBulbPositionMap[initializeOrToggle][chatColumnPaddingBottom],
        ]
    }

    /* Restore the memory bulb position to its original coordinates. */
    function restoreMemoryBulb() {
        // Nothing to do
        if (memoryBulbBtn === null)
            return

        // The left, bottom, and z-index has no effect with the static position
        memoryBulbBtn.style.position = 'static'
    }

    /* Update the bulb left position based on the window width. */
    function updateBulbPosition() {
        // Nothing to do
        if (memoryBulbBtn === null || textarea === null)
            return

        // Nothing to do, media query kicks in, and layout changes
        if (window.innerWidth < MobileBreakpoint)
            return

        memoryBulbBtn.style.left = elementPosition(textarea).left + CenterMemoryBulbFix + 'px'  // +CenterMemoryBulbFix to center it
    }

    /* Initialize the main chat textarea and moving the memory bulb related code. */
    async function initializeTextarea() {
        // Initialize moving the memory bulb into the main textarea
        await initializeMoveMemoryBulb()
        // Restore the chat textarea content from localStorage on page load
        // restoreTextareaContentFromStorage()
    }

    /* Initialize moving the memory bulb into the main textarea. */
    async function initializeMoveMemoryBulb() {
        // Wait until the given selector is available in the DOM
        // waitForElement('textarea[aria-label="Chat Input"], button[title="Memory Indicator"]', 3)
        const selector = 'textarea[aria-label="Chat Input"], ' +
                         'nav[role="navigation"] button[title="Memory Indicator"]'
        const elements = await waitForElement(selector, 2)

        // Initialize the global chat-related element variables
        initializeChatElements(elements)
        // Restore the chat textarea content from localStorage on page load
        // restoreTextareaContentFromStorage()
        /* Add padding below the main input box (padding-bottom for the chat column).
           Also, move the memory bulb into the main textarea. */
        modifyTextareaStyles()

        // Update the bulb left position based on the window width
        window.addEventListener('resize', updateBulbPosition)
        // Focus the main chat textarea
        focusTextarea()

        return elements
    }

    /**
     * Initialize the global chat-related element variables.
     *
     * @param {Nodelist} elements - HTML elements returned from the MutationObserver
     *                              (to initialize globals).
     */
    function initializeChatElements(elements) {
        // Nothing to do
        if (elements.length !== 2)
            return

        // memoryBulbBtn =
        //     document.documentElement.clientWidth < MobileBreakpoint ? elements[1] : elements[0]
        memoryBulbBtn = elements[0]
        textarea      = elements[1]
        chatColumn    = document.querySelector('.ChatSidebarLayout_root__jmxzE > :last-child')
    }

    /* Restore the chat textarea content from localStorage on page load. */
    function restoreTextareaContentFromStorage() { // eslint-disable-line no-unused-vars
        const content = localStorage.getItem(StorageTextareaKey)

        // Nothing to do
        if (!content)
            return

        if (textarea.value.length > 0)
            textarea.value += content
        else
            textarea.value = content
    }

    /* Save the chat textarea content to localStorage on page unload (beforeunload). */
    function saveTextareaContentToStorage() {
        // Nothing to do
        if (textarea === null)
            return

        const content = textarea.value

        // Nothing to do, is empty
        if (content === '') // Don't use the ! operator here
            return

        localStorage.setItem(StorageTextareaKey, content)
    }

    /* Initialize auto-click for the Continue Chat link. */
    async function autoClickMarissaContinueChat() {
        // Wait until the given selector is available in the DOM
        const elements = await waitForElement(`a.e1pbes5i3[href="${MarissaUrlPathname}"]`)

        // Initialize the global homepage-related element variables
        initializeHomeElements(elements)
        // Click the Continue Chat link on the homepage
        continueChatLink.click()
    }

    /**
     * Initialize the global homepage-related element variables.
     *
     * @param {Nodelist} elements - HTML elements returned from the MutationObserver
     *                              (to initialize globals).
     */
    function initializeHomeElements(elements) {
        // Nothing to do
        if (elements.length !== 1)
            return

        continueChatLink = elements[0]
    }

    /* Set all node references to null. */
    function resetNodeReferences() {
        memoryBulbBtn = null
        textarea      = null
        chatColumn    = null
    }

    /**
     * Move the memory bulb based on the current route (URL path; on chat page/route).
     *
     * @param {NavigateEvent} ev - NavigateEvent interface of the Navigation API.
     */
    function navigateHandler(ev) {
        const {origin, pathname} = new URL(ev.destination.url)

        // Nothing to do
        if (origin !== NomiAiUrlOrigin || ev.sameDocument === false)
            return

        switch (pathname) {
        // Marissa's chat
        case MarissaUrlPathname:
            // Initialize moving the memory bulb into the main textarea
            initializeMoveMemoryBulb()
            break

        default:
            // Restore the memory bulb position to its original coordinates
            restoreMemoryBulb()
            // Set all node references to null
            resetNodeReferences()
        }
    }

    /**
     * Focus the main chat textarea.
     *
     * @param {boolean} [select=false]     - Select containing value.
     * @param {boolean} [cursorToEnd=true] - Move cursor to the end.
     */
    function focusTextarea(select = false, cursorToEnd = true) {
        // Nothing to do
        if (!textarea)
            return

        // Focus only if it's not already focused
        if (document.activeElement !== textarea)
            textarea.focus()

        // Nothing to do, textarea is empty
        if (textarea.value.length <= 0)
            return

        // Move cursor to the end
        if (cursorToEnd && !select)
            textarea.selectionStart = textarea.selectionEnd = textarea.value.length

        // Select if contains some value
        else if (select)
            textarea.select()
    }

    /**
     * Determine whether some editable HTML element currently has a focus.
     *
     * @param {KeyboardEvent} ev - KeyboardEvent objects describe a user interaction with keyboard.
     *
     * @returns {boolean}
     */
    function isEditableFocused(ev) {
        return ev.target.isContentEditable       || ev.target.nodeName === 'INPUT' ||
               ev.target.nodeName === 'TEXTAREA' || ev.target.nodeName === 'SELECT'
    }

    /**
     * Wait until the given selector/s is available in the DOM.
     *
     * @param {string} selector   - Query string for the querySelectorAll().
     * @param {number} [length=1] - Number of expected elements.
     *
     * @returns {Promise}
     */
    function waitForElement(selector, length = 1) {
        return new Promise(resolve => {
            const elements = document.querySelectorAll(selector)

            // Nothing to do, all elements are already loaded (were found/queried)
            if (elements.length === length)
                return resolve(elements)

            // Otherwise fallback to the MutationObserver to wait for them
            const observer = new MutationObserver((/*mutations*/) => {
                const elements = document.querySelectorAll(selector)

                // Nothing to do
                if (elements.length !== length)
                    return

                observer.disconnect() // Don't move it above the check above!
                resolve(elements)
            })

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            })
        })
    }

    /**
     * Represents the position of an HTML element on the page.
     *
     * @typedef  {object} Position
     * @property {number} top  - The vertical offset of the element relative to the page.
     * @property {number} left - The horizontal offset of the element relative to the page.
     */

    /**
     * Get an HTML element position relative to the window (top/left only).
     *
     * @param {HTMLElement} element - HTML element for which to get the top and left positions.
     *
     * @returns {Position} The position of the element on the page.
     */
    function elementPosition(element) {
        const rect = element.getBoundingClientRect()
        const win  = element.ownerDocument.defaultView

        return {
            top:  rect.top  + win.pageYOffset,
            left: rect.left + win.pageXOffset,
        }
    }

    /**
     * Map CSS styles from an object to a string representation for the HTML styles attribute.
     *
     * @param {object} styles - CSS styles object to map to string.
     */
    function cssObjectToString(styles) {
        return Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(';')
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
