/**
 * A canvas that paints one frame of a packed sprite sheet.
 *
 * Why not CSS `background-position`? A background image is resampled by the
 * compositor after the element has been laid out, and at fractional scales the
 * clip edge can sample pixels from the neighbouring frame. Padding, negative
 * margins and half-pixel offsets only hide that for specific scale values.
 *
 * `drawImage` with an explicit source rectangle cannot read outside that
 * rectangle, so frames stay perfectly separated at any scale, including the
 * fractional sizes the pet-size slider produces. Drawing at device-pixel
 * resolution also keeps the nearest-neighbour upscale crisp.
 */
export class SpriteCanvas {
	readonly el: HTMLCanvasElement;

	private readonly ctx: CanvasRenderingContext2D;
	private readonly sourceWidth: number;
	private readonly sourceHeight: number;
	private readonly variantOffset: readonly [number, number];
	private sheet: HTMLImageElement | null = null;

	/** CSS pixels per source pixel (species scale × user pet size). */
	private displayScale: number;
	private frameCol = 0;
	private frameRow = 0;
	private flipped = false;
	private dpr = 1;
	/** Frame region size in cells (see StardewAnimation.span). */
	private spanW = 1;
	private spanH = 1;

	constructor(
		doc: Document,
		sourceWidth: number,
		sourceHeight: number,
		displayScale = 1,
		variantOffset: readonly [number, number] = [0, 0],
	) {
		this.sourceWidth = sourceWidth;
		this.sourceHeight = sourceHeight;
		this.displayScale = displayScale;
		this.variantOffset = variantOffset;

		this.el = createEl("canvas", { cls: "pet-sprite" });
		// `createEl` always builds in the main document; popout views may pass
		// another document, so adopt the canvas into it before creating the
		// context. (Appending directly to `doc` is invalid — the observable
		// `doc.createEl` would try to make the canvas the document's root.)
		if (this.el.ownerDocument !== doc) doc.adoptNode(this.el);
		const ctx = this.el.getContext("2d");
		if (!ctx) throw new Error("Canvas 2D context is unavailable");
		this.ctx = ctx;
		this.resize();
	}

	async load(url: string): Promise<void> {
		const img = new Image();
		img.src = url;
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${url}`));
		});
		this.sheet = img;
		this.render();
	}

	/** Change the on-screen size without touching the loaded sheet. */
	setDisplayScale(displayScale: number): void {
		if (displayScale === this.displayScale) return;
		this.displayScale = displayScale;
		this.resize();
		this.render();
	}

	setFrame(col: number, row: number): void {
		if (col === this.frameCol && row === this.frameRow) return;
		this.frameCol = col;
		this.frameRow = row;
		this.render();
	}

	setFlipped(flipped: boolean): void {
		if (flipped === this.flipped) return;
		this.flipped = flipped;
		this.render();
	}

	/** Switch between single-cell and multi-cell frame regions. */
	setSpan(spanW: number, spanH: number): void {
		if (spanW === this.spanW && spanH === this.spanH) return;
		this.spanW = spanW;
		this.spanH = spanH;
		this.resize();
		this.render();
	}

	/** Resize both the CSS box and the device-pixel backing store. */
	private resize(): void {
		const view = this.el.ownerDocument.defaultView ?? window;
		this.dpr = view.devicePixelRatio || 1;

		const cssWidth = Math.max(1, this.sourceWidth * this.spanW * this.displayScale);
		const cssHeight = Math.max(1, this.sourceHeight * this.spanH * this.displayScale);
		this.el.style.width = `${cssWidth}px`;
		this.el.style.height = `${cssHeight}px`;

		const width = Math.max(1, Math.round(cssWidth * this.dpr));
		const height = Math.max(1, Math.round(cssHeight * this.dpr));
		// Assigning width/height clears the bitmap and resets context state.
		if (this.el.width !== width) this.el.width = width;
		if (this.el.height !== height) this.el.height = height;
	}

	private render(): void {
		const view = this.el.ownerDocument.defaultView ?? window;
		// Dragging the window to another monitor can change the DPR mid-session.
		if ((view.devicePixelRatio || 1) !== this.dpr) this.resize();

		const { ctx, el } = this;
		ctx.clearRect(0, 0, el.width, el.height);
		if (!this.sheet) return;

		ctx.imageSmoothingEnabled = false;

		ctx.save();
		if (this.flipped) {
			ctx.translate(el.width, 0);
			ctx.scale(-1, 1);
		}
		ctx.drawImage(
			this.sheet,
			(this.frameCol + this.variantOffset[0]) * this.sourceWidth,
			(this.frameRow + this.variantOffset[1]) * this.sourceHeight,
			this.sourceWidth * this.spanW,
			this.sourceHeight * this.spanH,
			0,
			0,
			el.width,
			el.height,
		);
		ctx.restore();
	}
}
