class ResizeObserverMock {
  disconnect() {}

  observe() {}

  unobserve() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

class PointerEventMock extends MouseEvent {
  isPrimary: boolean;
  pointerId: number;
  pointerType: string;

  constructor(type: string, eventInitDict: PointerEventInit = {}) {
    super(type, eventInitDict);
    this.isPrimary = eventInitDict.isPrimary ?? true;
    this.pointerId = eventInitDict.pointerId ?? 0;
    this.pointerType = eventInitDict.pointerType ?? "mouse";
  }
}

globalThis.PointerEvent = PointerEventMock as unknown as typeof PointerEvent;

document.getAnimations = () => [];
Element.prototype.getAnimations = () => [];

window.matchMedia = () => ({
  addEventListener() {},
  addListener() {},
  dispatchEvent() {
    return false;
  },
  matches: false,
  media: "",
  onchange: null,
  removeEventListener() {},
  removeListener() {},
});
