import Coordinate from 'coordinate-systems';

const toRadians = degree => {
  return degree*(Math.PI/180);
};

const toDegrees = rad => {
  return rad/(Math.PI/180);
};

export default class ModJoystick {
  constructor(params) {
    // if it has params.rotation and params.radius,
      // do inverse calculations to work out:
        // joystickX
        // joystickY
        // joystickWidth
        // joystickHeight

    this.startDrag = false;
    this.polarToCartesian = this.polarToCartesian.bind(this);
    this.resetJoystickPos = this.resetJoystickPos.bind(this);
    this.updateJoystickPos = this.updateJoystickPos.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.mouseLeave = this.mouseLeave.bind(this);
    this.calcParams = this.calcParams.bind(this);

    this.onJoystickMouseOver = this.onJoystickMouseOver.bind(this);
    this.onJoystickMouseLeave = this.onJoystickMouseLeave.bind(this);

    this.onChange = params.onChange;
    this.onLeave = params.onLeave;
    this.onSet = params.onSet;

    this.joystickX = 0;
    this.joystickY = 0;
    this.joystickWidth = 0;
    this.joystickHeight = 0;

    this.segments = params.segments;

    this.markers;
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
      el.addEventListener('mouseover', this.onJoystickMouseOver);
      el.addEventListener('mouseleave', this.onJoystickMouseLeave);

      el.ondragstart = function() { return false };

      const markers = document.createElement('div');
      markers.classList.add('mod-markers');
      markers.innerText = '＋';

      const segmentFragment = document.createDocumentFragment();
      for (let segmentIndex = 0; segmentIndex < this.segments; segmentIndex++) {
        const newSegment = document.createElement('div');
        newSegment.classList.add('segment');

        const segmentRotation = segmentIndex*(180/(this.segments));
        newSegment.style.transform = `rotate(${segmentRotation}deg)`;

        segmentFragment.appendChild(newSegment);
      }

      markers.append(segmentFragment);
      container.appendChild(markers);
      container.appendChild(el);

      this.markers = markers;
      this.joystickEl = el;

      return container;
    })();

    setTimeout(() => {
      this.joystickWidth = this.joystickEl.clientWidth;
      this.joystickHeight = this.joystickEl.clientHeight;
      this.resetJoystickPos();
      if (params.segment && params.dist) {
        const {x, y} = this.polarToCartesian(params.segment, params.dist);
        this.joystickX += x;
        this.joystickY += y;
        this.updateJoystickPos();
      }
    });
  }

  onJoystickMouseLeave() {
    this.markers.classList.remove('segments-visible');
  }

  onJoystickMouseOver() {
    this.markers.classList.add('segments-visible');
  }

  resetJoystickPos() {
    this.joystickX = this.element.clientWidth/2;
    this.joystickY = this.element.clientHeight/2;
    this.updateJoystickPos();
  }

  updateJoystickPos() {
    this.joystickEl.style.left = `${this.joystickX-this.joystickWidth/2}px`;
    this.joystickEl.style.top = `${this.joystickY-this.joystickHeight/2}px`;
  }

  polarToCartesian(segment, dist) {
    const segmentArc = 180/this.segments
    let rotation = (segment*segmentArc)-segmentArc-180;

    rotation = rotation + segmentArc/2; // to make joystick land on segment
    rotation = toRadians(rotation);

    const coord = new Coordinate.polar([dist, rotation]);

    const x = coord.cartesian()[0]*(this.element.clientWidth/2);
    const y = coord.cartesian()[1]*(this.element.clientWidth/2);

    return { x, y };
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
      x: this.joystickX+this.mouseOffsetX,
      y: this.joystickY+this.mouseOffsetY,
    };

    const diffX = joystick.x-center.x;
    const diffY = joystick.y-center.y;

    const coord = new Coordinate.cart([diffX, diffY]);

    const rotation = toDegrees(coord.polar()[1])+180;

    let segment = parseInt(rotation/(360/(this.segments*2))) + 1;
    let degree = coord.polar()[0]/(this.element.clientWidth/2)

    if (segment > this.segments) { // inverse segments
      segment = segment-this.segments;
      degree = degree*-1;
    }

    degree = Number(String(degree).substring(0, 4)).toFixed(2);

    return { segment, degree };
  }

  onMouseUp(e) {
    if (!this.startDrag) { return; }
    this.startDrag = false;
    const {segment, degree} = this.calcParams();
    this.onSet(segment, degree);
  }

  onMouseMove(e) {
    if (!this.startDrag) { return; }
    let shiftX = e.clientX - this.joystickEl.getBoundingClientRect().left - this.joystickWidth/2;
    let shiftY = e.clientY - this.joystickEl.getBoundingClientRect().top - this.joystickHeight/2;

    this.joystickX += shiftX-this.mouseOffsetX;
    this.joystickY += shiftY-this.mouseOffsetY;
    this.updateJoystickPos();

    const {segment, degree} = this.calcParams();
    this.onChange(segment, degree);
  }

  mouseLeave(e) {
    if (!this.startDrag) { return; }
    this.startDrag = false;

    const {segment, degree} = this.calcParams();
    this.onLeave(segment, degree);
  }
}
