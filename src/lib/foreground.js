export class Foreground {
    constructor(_foregroundEl) {
        this.foregroundElement = _foregroundEl;
        this.el.classList.toggle('active', true);
    }

    get el() {
        if (this.foregroundElement) { return this.foregroundElement; };
        const foregroundList = document.getElementsByClassName('foreground');
        if (foregroundList.length == 1) {
            return foregroundList.item(0);
        } else if (foregroundList.length > 1){
            console.warn('Foreground object missing element and cannot resolve it from document as there are multiple')
            return foregroundList.item(foregroundList.length - 1);
        };
    };

    active(isActive = true) {
        this.el.classList.toggle('active', isActive);
    };

    newWindow(userFunction = () => { return; }){
        userFunction();
    }
}

/**
 * A modal confirmation dialog that appears centered on screen with a foreground overlay.
 * Uses the same pattern as the startscreen component.
 * Used for destructive actions like delete, remove, or clear operations.
 */
export class ConfirmationDialog {
    /**
     * Creates and displays a confirmation dialog.
     * @param {string} message - The message to display in the dialog.
     * @param {Function} onConfirm - Callback executed when user confirms.
     * @param {Function} [onCancel=null] - Optional callback executed when user cancels.
     * @param {Object} [options] - Optional configuration.
     * @param {string} [options.confirmText='confirm'] - Text for the confirm button.
     * @param {string} [options.cancelText='cancel'] - Text for the cancel button.
     */
    constructor(message, onConfirm, onCancel = null, options = {}) {
        const { confirmText = 'confirm', cancelText = 'cancel' } = options;

        this.onConfirm = onConfirm;
        this.onCancel = onCancel;

        // Activate foreground overlay
        this.foreground = new Foreground();
        this.foreground.active(true);

        const dialogContainer = document.createElement('div');
        dialogContainer.classList.add('confirmationDialog');
        dialogContainer.innerHTML = `
            <h2>${message}</h2>
            <span><strong>Tip</strong>: Hold Shift while clicking to skip confirmations</span>
            <div class='menu-container'>
                <button class='menuButton' id='cancelBtn'>${cancelText}</button>
                <button class='menuButton' id='confirmBtn'>${confirmText}</button>
            </div>
        `;
        this.foreground.el.appendChild(dialogContainer);

        const cancelBtn = dialogContainer.querySelector('#cancelBtn');
        cancelBtn.addEventListener('click', () => {
            this.cleanup();
            if (this.onCancel) {
                this.onCancel();
            }
        });

        const confirmBtn = dialogContainer.querySelector('#confirmBtn');
        confirmBtn.addEventListener('click', () => {
            this.cleanup();
            if (this.onConfirm) {
                this.onConfirm();
            }
        });

        // Handle escape key to cancel
        this.keyHandler = (event) => {
            if (event.key === 'Escape') {
                this.cleanup();
                if (this.onCancel) {
                    this.onCancel();
                }
            }
        };
        document.addEventListener('keydown', this.keyHandler);

        // Store reference for cleanup
        this.dialogContainer = dialogContainer;
    }

    /**
     * Cleans up the dialog and event listeners.
     */
    cleanup() {
        document.removeEventListener('keydown', this.keyHandler);
        this.dialogContainer.remove();
        this.foreground.active(false);
    }
}
