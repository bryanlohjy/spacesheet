export default class ModJoystick {
  constructor(params) {
    // if it has params.rotation and params.radius,
      // do inverse calculations to work out:
        // joystickX
        // joystickY
        // joystickWidth
        // joystickHeight

    this.startDrag = false;
    this.resetJoystickPos = this.resetJoystickPos.bind(this);
    this.updateJoystickPos = this.updateJoystickPos.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.calcParams = this.calcParams.bind(this);

    this.onChange = params.onChange;
    this.onLeave = params.onLeave;
    this.onSet = params.onSet;

    this.joystickX = 0;
    this.joystickY = 0;
    this.joystickWidth = 0;
    this.joystickHeight = 0;

    this.joystickEl;

    this.element = (() => {
      const container = document.createElement('div');
      container.classList.add('mod-container');
      container.style.width = `${params.cellWidth - 1}px`;
      container.style.height = `${params.cellHeight - 1}px`;
      container.addEventListener('mouseleave', this.mouseLeave);
      container.addEventListener('mouseup', this.onMouseUp);
      container.addEventListener('mousemove', this.onMouseMove);

      const el = document.createElement('div');
      el.classList.add('mod-joystick');

      el.addEventListener('mousedown', this.onMouseDown);
      el.addEventListener('mouseup', this.onMouseUp);
      el.ondragstart = function() { return false };

      const markers = document.createElement('div');
      markers.classList.add('mod-markers');
      markers.innerText = '＋';

      container.appendChild(markers);
      container.appendChild(el);

      this.joystickEl = el;

      return container;
    })();

    setTimeout(() => {
      this.resetJoystickPos();
    });
  }

  resetJoystickPos() {
    this.joystickWidth = this.joystickEl.clientWidth;
    this.joystickHeight = this.joystickEl.clientHeight;

    this.joystickX = this.element.clientWidth/2;
    this.joystickY = this.element.clientHeight/2;
    this.updateJoystickPos();
  }

  updateJoystickPos() {
    this.joystickEl.style.left = `${this.joystickX-this.joystickWidth/2}px`;
    this.joystickEl.style.top = `${this.joystickY-this.joystickHeight/2}px`;
  }

  onMouseDown(e) {
    this.startDrag = true;
    this.mouseOffsetX = e.clientX-this.joystickEl.getBoundingClientRect().left-this.joystickHeight/2;
    this.mouseOffsetY = e.clientY-this.joystickEl.getBoundingClientRect().top-this.joystickWidth/2;
  }

  calcParams() {
    const center = {
      x: this.element.clientWidth/2,
      y: this.element.clientHeight/2,
    };

    const joystick = {
      x: (this.joystickX+this.mouseOffsetX),
      y: (this.joystickY+this.mouseOffsetY),
    };

    const diffX = joystick.x-center.x;
    const diffY = joystick.y-center.y;

    const radius = (Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2)))/center.x;
    const rotation = (Math.atan2(diffY, diffX) * 180 / Math.PI) + 180;

    return { rotation: rotation, radius: radius };
  }

  onMouseUp(e) {
    if (!this.startDrag) { return; }
    this.startDrag = false;
    const {rotation, radius} = this.calcParams();
    this.onSet(rotation, radius);
  }

  onMouseMove(e) {
    if (!this.startDrag) { return; }
    let shiftX = e.clientX - this.joystickEl.getBoundingClientRect().left - this.joystickWidth/2;
    let shiftY = e.clientY - this.joystickEl.getBoundingClientRect().top - this.joystickHeight/2;

    this.joystickX += shiftX-this.mouseOffsetX;
    this.joystickY += shiftY-this.mouseOffsetY;
    this.updateJoystickPos();

    const {rotation, radius} = this.calcParams();
    this.onChange(rotation, radius);
  }

  mouseLeave(e) {
    if (!this.startDrag) { return; }
    this.startDrag = false;

    const {rotation, radius} = this.calcParams();
    this.resetJoystickPos();
    this.onLeave(rotation, radius);
  }
}
