import { AddTextBoxButton, AddStaveBoxButton, AddNotationLegendButton, AddZoomControls } from "@/component/ribbon.js";
import { exportFile } from '@/lib/exportFile.js';

export class Workspace {
    
    constructor(_workspaceEl){
        this.ChildObjects = [];
        this.workspaceElement = _workspaceEl;

        // Zoom and pan state
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.lastPanX = 0;
        this.lastPanY = 0;

        // Minimum and maximum zoom levels
        this.minScale = 0.3;
        this.maxScale = 3.0;
        this.zoomSensitivity = 0.001;

        const ribbon = document.getElementsByClassName('ribbonContainer').item(0);
        const exportButton = document.getElementsByClassName('exportButton').item(0);
        exportButton.innerHTML = window.electronAPI.getIcon('saveFile');

        AddTextBoxButton(ribbon, this);
        AddStaveBoxButton(ribbon, this);
        AddNotationLegendButton(ribbon, this);
        AddZoomControls(ribbon, this);

        exportButton.onclick = () => {
            let textBuffer = ``;
            this.ChildObjects.forEach(element => {
                textBuffer += element.parseStringContents();
                textBuffer += `\n`;
            });
            exportFile(textBuffer);
        };

        this.setupZoomAndPan();
    };

    get el() {
        if (this.workspaceElement) { return this.workspaceElement; };
        const workspaceList = document.getElementsByClassName('workspaceContainer');
        if (workspaceList.length == 1) {
            this.workspaceElement = workspaceList.item(0)
            return this.workspaceElement;
        } else if (workspaceList.length > 1){
            console.warn('Workspace object missing element and cannot resolve it from document as there are multiple');
            return workspaceList.item(workspaceList.length - 1);
        };
    };

    /**
     * Get the size of 1em in CSS pixels (unscaled)
     * This is the base em size before any zoom/transform
     */
    get emSize() {
        if (!this.workspaceElement) return false;
        // Create a test element to measure 1em
        const em = document.createElement('div');
        em.style.cssText = 'width:1em; height:1em; padding:0; margin:0; position:absolute; visibility:hidden;';
        this.el.appendChild(em);
        const rect = em.getBoundingClientRect();
        em.remove();
        
        // Return the CSS pixel size (unscaled)
        // When using transform:scale, getBoundingClientRect includes the scale
        // So we divide by current scale to get the base size
        return {
            width: rect.width / this.scale,
            height: rect.height / this.scale
        };
    };

    /**
     * Apply the current zoom and pan to the workspace
     * Uses CSS transform: scale() which provides predictable coordinate math
     */
    applyTransform() {
        // Apply transform with origin at top-left (default)
        // translate moves the element, scale scales it from the origin
        this.el.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }

    /**
     * Set up zoom and pan event handlers
     */
    setupZoomAndPan() {
        const appContent = document.getElementsByClassName('appContent').item(0);

        // Zoom with Ctrl + Scroll or trackpad pinch (Ctrl + wheel)
        appContent.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                this.handleZoom(e);
            }
        }, { passive: false });

        // Middle-click panning or Ctrl + click panning
        appContent.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                e.preventDefault();
                this.startPan(e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.handlePan(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if ((e.button === 1 || e.button === 0) && this.isPanning) {
                this.endPan();
            }
        });

        // Prevent default middle-click behavior (autoscroll)
        appContent.addEventListener('auxclick', (e) => {
            if (e.button === 1) {
                e.preventDefault();
            }
        });

        // Keyboard shortcut: Ctrl+0 to reset zoom
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.resetView();
                if (this.onViewChanged) this.onViewChanged();
            }
        });
    }

    /**
     * Handle zoom event
     * Zooms toward the mouse cursor position
     * 
     * The math: We want the point under the mouse to stay under the mouse after zooming.
     * With transform: scale(), the element scales from its top-left origin.
     * 
     * If the mouse is at (mx, my) relative to the element's top-left:
     * - Before zoom: point P is at (mx, my) in element coordinates
     * - After zoom by factor S: point P is at (mx * S, my * S) in screen coordinates
     * - To keep P under the mouse, we need to pan by: (mx - mx * S) = mx * (1 - S)
     */
    handleZoom(e) {
        // Get the workspace's screen position and size
        const rect = this.el.getBoundingClientRect();
        
        // Calculate new scale
        const delta = -e.deltaY * this.zoomSensitivity;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * (1 + delta)));
        
        if (newScale === this.scale) return;
        
        const scaleRatio = newScale / this.scale;
        
        // Mouse position relative to the element's top-left corner
        // This is the point we want to keep stationary
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        
        // The point at (relativeX, relativeY) would move to (relativeX * scaleRatio, relativeY * scaleRatio)
        // after scaling. To compensate, we pan by the difference.
        // We divide by the current scale to convert screen pixels to transform pixels
        const panDeltaX = relativeX * (1 - scaleRatio) / this.scale;
        const panDeltaY = relativeY * (1 - scaleRatio) / this.scale;
        
        this.panX += panDeltaX;
        this.panY += panDeltaY;
        this.scale = newScale;

        this.applyTransform();
        if (this.onViewChanged) this.onViewChanged();
    }

    /**
     * Start panning with middle-click
     */
    startPan(e) {
        this.isPanning = true;
        this.panStartX = e.clientX;
        this.panStartY = e.clientY;
        this.lastPanX = this.panX;
        this.lastPanY = this.panY;
        
        document.body.style.cursor = 'grabbing';
        this.el.style.cursor = 'grabbing';
    }

    /**
     * Handle pan movement
     */
    handlePan(e) {
        if (!this.isPanning) return;
        
        const deltaX = e.clientX - this.panStartX;
        const deltaY = e.clientY - this.panStartY;
        
        // Pan deltas are in screen pixels, but our transform is applied at scale 1
        // So we need to divide by the current scale
        this.panX = this.lastPanX + deltaX / this.scale;
        this.panY = this.lastPanY + deltaY / this.scale;
        
        this.applyTransform();
        if (this.onViewChanged) this.onViewChanged();
    }

    /**
     * End panning
     */
    endPan() {
        this.isPanning = false;
        document.body.style.cursor = 'auto';
        this.el.style.cursor = 'auto';
    }

    /**
     * Reset zoom and pan to default
     */
    resetView() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
        if (this.onViewChanged) this.onViewChanged();
    }

    /**
     * Zoom in by a fixed increment
     */
    zoomIn() {
        const zoomFactor = 1.2;
        const newScale = Math.min(this.maxScale, this.scale * zoomFactor);
        if (newScale !== this.scale) {
            // Zoom toward center of viewport
            const appContent = document.getElementsByClassName('appContent').item(0);
            const rect = appContent.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Get workspace position relative to viewport
            const workspaceRect = this.el.getBoundingClientRect();
            const relativeX = centerX - workspaceRect.left;
            const relativeY = centerY - workspaceRect.top;
            
            const scaleRatio = newScale / this.scale;
            this.panX += relativeX * (1 - scaleRatio) / this.scale;
            this.panY += relativeY * (1 - scaleRatio) / this.scale;
            this.scale = newScale;
            this.applyTransform();
            if (this.onViewChanged) this.onViewChanged();
        }
    }

    /**
     * Zoom out by a fixed increment
     */
    zoomOut() {
        const zoomFactor = 1 / 1.2;
        const newScale = Math.max(this.minScale, this.scale * zoomFactor);
        if (newScale !== this.scale) {
            // Zoom toward center of viewport
            const appContent = document.getElementsByClassName('appContent').item(0);
            const rect = appContent.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Get workspace position relative to viewport
            const workspaceRect = this.el.getBoundingClientRect();
            const relativeX = centerX - workspaceRect.left;
            const relativeY = centerY - workspaceRect.top;
            
            const scaleRatio = newScale / this.scale;
            this.panX += relativeX * (1 - scaleRatio) / this.scale;
            this.panY += relativeY * (1 - scaleRatio) / this.scale;
            this.scale = newScale;
            this.applyTransform();
            if (this.onViewChanged) this.onViewChanged();
        }
    }
    
};
