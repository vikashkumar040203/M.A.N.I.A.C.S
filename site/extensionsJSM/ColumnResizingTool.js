/*
*  Copyright (C) 1998-2022 by Northwoods Software Corporation. All Rights Reserved.
*/
/*
* This is an extension and not part of the main GoJS library.
* Note that the API for this class may change with any version, even point releases.
* If you intend to use an extension in production, you should copy the code to your own source directory.
* Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
* See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
*/
import * as go from '../release/go-module.js';
/**
 * The ColumnResizingTool class lets the user resize each column of a named Table Panel in a selected Part.
 *
 * If you want to experiment with this extension, try the <a href="../../extensionsJSM/ColumnResizing.html">Column Resizing</a> sample.
 * @category Tool Extension
 */
export class ColumnResizingTool extends go.Tool {
    /**
     * Constructs a ColumnResizingTool and sets the handle and name of the tool.
     */
    constructor() {
        super();
        this._tableName = 'TABLE';
        // internal state
        this._handle = null;
        this._adornedTable = null;
        const h = new go.Shape();
        h.geometryString = 'M0 0 V14 M2 0 V14';
        h.desiredSize = new go.Size(2, 14);
        h.cursor = 'col-resize';
        h.geometryStretch = go.GraphObject.None;
        h.background = 'rgba(255,255,255,0.5)';
        h.stroke = 'rgba(30,144,255,0.5)';
        this._handleArchetype = h;
        this.name = 'ColumnResizing';
    }
    /**
     * Gets or sets small GraphObject that is copied as a resize handle for each column.
     * This tool expects that this object's {@link GraphObject#desiredSize} (a.k.a width and height) has been set to real numbers.
     *
     * The default value is a {@link Shape} that is a narrow rectangle.
     */
    get handleArchetype() { return this._handleArchetype; }
    set handleArchetype(val) { this._handleArchetype = val; }
    /**
     * Gets or sets the name of the Table Panel to be resized.
     *
     * The default value is the name "TABLE".
     */
    get tableName() { return this._tableName; }
    set tableName(val) { this._tableName = val; }
    /**
     * This read-only property returns the {@link GraphObject} that is the tool handle being dragged by the user.
     * This will be contained by an {@link Adornment} whose category is "ColumnResizing".
     * Its {@link Adornment#adornedObject} is the same as the {@link #adornedTable}.
     */
    get handle() { return this._handle; }
    /**
     * This read-only property returns the {@link Panel} of type {@link Panel.Table} whose columns are being resized.
     * This must be contained within the selected {@link Part}.
     */
    get adornedTable() { return this._adornedTable; }
    /**
     * Show an {@link Adornment} with a resize handle at each column.
     * Don't show anything if {@link #tableName} doesn't identify a {@link Panel}
     * that has a {@link Panel#type} of type {@link Panel.Table}.
     */
    updateAdornments(part) {
        if (part === null || part instanceof go.Link)
            return; // this tool never applies to Links
        if (part.isSelected && !this.diagram.isReadOnly) {
            const selelt = part.findObject(this.tableName);
            if (selelt instanceof go.Panel && selelt.actualBounds.isReal() && selelt.isVisibleObject() &&
                part.actualBounds.isReal() && part.isVisible() &&
                selelt.type === go.Panel.Table) {
                const table = selelt;
                let adornment = part.findAdornment(this.name);
                if (adornment === null) {
                    adornment = this.makeAdornment(table);
                    part.addAdornment(this.name, adornment);
                }
                if (adornment !== null) {
                    const pad = table.padding;
                    const numcols = table.columnCount;
                    // update the position/alignment of each handle
                    adornment.elements.each((h) => {
                        if (!h.pickable)
                            return;
                        const coldef = table.getColumnDefinition(h.column);
                        let wid = coldef.actual;
                        if (wid > 0)
                            wid = coldef.total;
                        let sep = 0;
                        // find next non-zero-width column's separatorStrokeWidth
                        let idx = h.column + 1;
                        while (idx < numcols && table.getColumnDefinition(idx).actual === 0)
                            idx++;
                        if (idx < numcols) {
                            sep = table.getColumnDefinition(idx).separatorStrokeWidth;
                            if (isNaN(sep))
                                sep = table.defaultColumnSeparatorStrokeWidth;
                        }
                        h.alignment = new go.Spot(0, 0, pad.left + coldef.position + wid + sep / 2, pad.top + h.height / 2);
                    });
                    adornment.locationObject.desiredSize = table.actualBounds.size;
                    adornment.location = table.getDocumentPoint(adornment.locationSpot);
                    adornment.angle = table.getDocumentAngle();
                    return;
                }
            }
        }
        part.removeAdornment(this.name);
    }
    /**
     * @hidden @internal
     * @param {Panel} table the Table Panel whose columns may be resized
     * @return {Adornment}
     */
    makeAdornment(table) {
        // the Adornment is a Spot Panel holding resize handles
        const adornment = new go.Adornment();
        adornment.category = this.name;
        adornment.adornedObject = table;
        adornment.type = go.Panel.Spot;
        adornment.locationObjectName = 'BLOCK';
        // create the "main" element of the Spot Panel
        const block = new go.TextBlock(); // doesn't matter much what this is
        block.name = 'BLOCK';
        block.pickable = false; // it's transparent and not pickable
        adornment.add(block);
        // now add resize handles for each column
        for (let i = 0; i < table.columnCount; i++) {
            const coldef = table.getColumnDefinition(i);
            const h = this.makeHandle(table, coldef);
            if (h !== null)
                adornment.add(h);
        }
        return adornment;
    }
    /**
     * @hidden @internal
     * @param {Panel} table the Table Panel whose columns may be resized
     * @param {RowColumnDefinition} coldef the column definition to be resized
     * @return a copy of the {@link #handleArchetype}
     */
    makeHandle(table, coldef) {
        const h = this.handleArchetype;
        if (h === null)
            return null;
        const c = h.copy();
        c.column = coldef.index;
        return c;
    }
    /**
     * This tool may run when there is a mouse-down event on a "ColumnResizing" handle,
     * the diagram is not read-only, the left mouse button is being used,
     * and this tool's adornment's resize handle is at the current mouse point.
     */
    canStart() {
        if (!this.isEnabled)
            return false;
        const diagram = this.diagram;
        if (diagram.isReadOnly)
            return false;
        if (!diagram.lastInput.left)
            return false;
        const h = this.findToolHandleAt(diagram.firstInput.documentPoint, this.name);
        return (h !== null);
    }
    /**
     * Find the {@link #handle}, ensure type {@link Panel.Table}, capture the mouse, and start a transaction.
     *
     * If the call to {@link Tool#findToolHandleAt} finds no "ColumnResizing" tool handle, this method returns without activating this tool.
     */
    doActivate() {
        const diagram = this.diagram;
        this._handle = this.findToolHandleAt(diagram.firstInput.documentPoint, this.name);
        if (this.handle === null)
            return;
        const panel = this.handle.part.adornedObject;
        if (!panel || panel.type !== go.Panel.Table)
            return;
        this._adornedTable = panel;
        diagram.isMouseCaptured = true;
        this.startTransaction(this.name);
        this.isActive = true;
    }
    /**
     * Stop the current transaction and release the mouse.
     */
    doDeactivate() {
        this.stopTransaction();
        this._handle = null;
        this._adornedTable = null;
        const diagram = this.diagram;
        diagram.isMouseCaptured = false;
        this.isActive = false;
    }
    /**
     * Call {@link #resize} with a new size determined by the current mouse point.
     * This determines the new bounds by calling {@link #computeResize}.
     */
    doMouseMove() {
        const diagram = this.diagram;
        if (this.isActive) {
            const newpt = this.computeResize(diagram.lastInput.documentPoint);
            this.resize(newpt);
        }
    }
    /**
     * Call {@link #resize} with the final bounds based on the most recent mouse point, and commit the transaction.
     * This determines the new bounds by calling {@link #computeResize}.
     */
    doMouseUp() {
        const diagram = this.diagram;
        if (this.isActive) {
            const newpt = this.computeResize(diagram.lastInput.documentPoint);
            this.resize(newpt);
            this.transactionResult = this.name; // success
        }
        this.stopTool();
    }
    /**
     * Change the {@link RowColumnDefinition#width} of the column being resized
     * to a value corresponding to the given mouse point.
     * @param {Point} newPoint the value returned by the call to {@link #computeResize}
     */
    resize(newPoint) {
        const table = this.adornedTable;
        if (table === null)
            return;
        const h = this.handle;
        if (h === null)
            return;
        const pad = table.padding;
        const numcols = table.columnCount;
        const locpt = table.getLocalPoint(newPoint);
        const coldef = table.getColumnDefinition(h.column);
        let sep = 0;
        let idx = h.column + 1;
        while (idx < numcols && table.getColumnDefinition(idx).actual === 0)
            idx++;
        if (idx < numcols) {
            sep = table.getColumnDefinition(idx).separatorStrokeWidth;
            if (isNaN(sep))
                sep = table.defaultColumnSeparatorStrokeWidth;
        }
        coldef.width = Math.max(0, locpt.x - pad.left - coldef.position - (coldef.total - coldef.actual) - sep / 2);
    }
    /**
     * This can be overridden in order to customize the resizing process.
     * @expose
     * @param {Point} p the point where the handle is being dragged
     * @return {Point}
     */
    computeResize(p) {
        return p;
    }
    /**
     * Pressing the Delete key removes any column width setting and stops this tool.
     */
    doKeyDown() {
        if (!this.isActive)
            return;
        const e = this.diagram.lastInput;
        if (e.key === 'Del' || e.key === '\t') { // remove width setting
            if (this.adornedTable !== null && this.handle !== null) {
                const coldef = this.adornedTable.getColumnDefinition(this.handle.column);
                coldef.width = NaN;
                this.transactionResult = this.name; // success
                this.stopTool();
                return;
            }
        }
        super.doKeyDown();
    }
}
