// @ts-check

/** Default forces */

const COLLISION = "COLLISION";
const VERTICAL_SCENE_EXIT = "VERTICAL_SCENE_EXIT";
const HORIZONTAL_SCENE_EXIT = "HORIZONTAL_SCENE_EXIT";

const FRICTION = (body) => {
  return {
    x: -body.vx / 5,
    y: -body.vy / 5,
  };
};

/** ball entity */

class Body {
  constructor(config) {
    this.config = config;

    this.width = config.width;
    this.height = config.height;

    this.y = config.y;
    this.x = config.x;

    this.vx = 0;
    this.vy = 0;

    this.ax = 0;
    this.ay = 0;

    this.eventListeners = {};

    this.forces = []; // force : obj of shape { x, y}
    this.dynamicForces = [];

    this.collidable = [];
  }

  getAcceleration() {
    let ax = this.ax;
    let ay = this.ay;

    this.dynamicForces.forEach((computeForce) => {
      let numericForce = computeForce(this);

      ax += numericForce.x;
      ay += numericForce.y;
    });

    return { x: ax, y: ay };
  }

  shouldCollideWith(body) {
    this.collidable.push(body);
    return this;
  }

  applyForce(force) {
    this.forces.push(force);
    this.updateAcceleration();
    return this;
  }

  applyDynamicForce(force) {
    this.dynamicForces.push(force);
    return this;
  }

  updateAcceleration() {
    this.ax = 0;
    this.ay = 0;

    this.forces.forEach((force) => {
      this.ax += force.x;
      this.ay += force.y;
    });
  }

  intersect(begin1, end1, begin2, end2) {
    if (begin2 <= begin1 && begin1 <= end2) {
      let d1 = begin2 - begin1;
      let d2 = end2 - begin1;

      return -d1 < d2 ? -d1 : d2;
    }

    if (begin1 <= begin2 && begin2 <= end1) {
      let d1 = begin1 - begin2;
      let d2 = end1 - begin2;

      return -d1 < d2 ? -d1 : -d2;
    }

    return 0;
  }

  bodyIntersect(body) {
    let dx = this.intersect(
      this.x,
      this.x + this.width,
      body.x,
      body.x + body.width
    );

    let dy = this.intersect(
      this.y,
      this.y + this.height,
      body.y,
      body.y + body.height
    );

    return dx && dy ? { x: dx, y: dy } : 0;
  }

  addEventListener(name, callback) {
    this.eventListeners[name] = this.eventListeners[name] || [];

    this.eventListeners[name].push(callback);
  }

  dispatchEvent(name, data) {
    this.eventListeners[name] &&
      this.eventListeners[name].forEach((cb) => cb(data));
  }
}

class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  render(bodies) {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    bodies.forEach((body) => {
      this.ctx.fillStyle = body.config.color;
      this.ctx.fillRect(
        Math.floor(body.x),
        Math.floor(body.y),
        body.width,
        body.height
      );

      this.postProcess(body);
    });
  }

  postProcess(body) {
    if (body.x <= 0 || body.x + body.width >= this.canvas.width) {
      body.dispatchEvent(HORIZONTAL_SCENE_EXIT, scene);
    }

    if (body.y <= 0 || body.y + body.height >= this.canvas.height) {
      body.dispatchEvent(VERTICAL_SCENE_EXIT, scene);
    }
  }
}

class Engine {
  constructor(scene) {
    this.bodies = [];
  }

  add(body) {
    this.bodies.push(body);
  }

  forwardBody(body, delta) {
    let a = body.getAcceleration();

    body.vx += a.x * delta;
    body.vy += a.y * delta;

    body.x += body.vx * delta;
    body.y += body.vy * delta;
  }

  forward(delta) {
    this.bodies.forEach((body) => {
      this.forwardBody(body, delta);

      for (const collidable of body.collidable) {
        let vector = body.bodyIntersect(collidable);
        if (vector) {
          if (Math.abs(vector.x) < Math.abs(vector.y)) {
            body.x += vector.x;

            body.vx *= -1;
            body.vy = (body.vy + collidable.vy) / 2;
          } else {
            body.y += vector.y;

            body.vx = (body.vx + collidable.vx) / 2;
          }

          body.dispatchEvent(COLLISION, collidable);
          break;
        }
      }

      this.forwardBody(body, delta);
    });
  }
}

const KeyBoard = {
  keys: new Set(),
  isPressed(key) {
    return this.keys.has(key);
  },
};

/** script */

let scene = new Scene(document.getElementById("scene"));
let engine = new Engine(scene);

let ball = new Body({
  x: 100,
  y: 110,
  width: 10,
  height: 10,
  color: "red",
});

let glider = new Body({
  x: 0,
  y: 0,
  type: "glider",
  name: "glider1",
  width: 20,
  height: 100,
  color: "green",
}).applyDynamicForce(FRICTION);

let glider2 = new Body({
  x: scene.canvas.width - 20,
  y: 0,
  width: 20,
  type: "glider",
  height: 100,
  color: "blue",
  name: "glider2",
}).applyDynamicForce(FRICTION);

ball.shouldCollideWith(glider);
ball.shouldCollideWith(glider2);

ball.addEventListener(HORIZONTAL_SCENE_EXIT, () => {
  if (ball.x <= 0) {
    alert("game lost");
  }else {
    alert("game lost")
  } 

  ball.x = 250;
  ball.y = 250;
  ball.vy = 0;
  ball.vx = ( Math.round(Math.random()) * 2 - 1 ) * 100;

  glider.y = 0;
  glider.vy = 0;
  glider.ay = 0;

  glider2.y  = 0;
  glider2.ay = 0;
  glider2.vy = 0;
});

ball.addEventListener(VERTICAL_SCENE_EXIT, () => {
  ball.vy = -ball.vy;
});

ball.addEventListener(COLLISION, (body) => {
  if (body.config.type !== "glider") return;

  ball.vx += Math.sign(ball.vx) * 10;

});
engine.add(ball);
engine.add(glider);
engine.add(glider2);

let prevTime = 0;

const run = (time) => {
  if (!prevTime) prevTime = time;

  engine.forward((time - prevTime) / 1000);

  prevTime = time;

  requestAnimationFrame(run);
};

const render = () => {
  scene.render(engine.bodies);
  requestAnimationFrame(render);
};

requestAnimationFrame(run);
requestAnimationFrame(render);

// ball.vy = 100;
ball.vx = 100;

/** controls  */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    glider.ay = 200;
  }

  if (e.key === "ArrowUp") {
    glider.ay = -200;
  }

  if (e.key === "s") {
    glider2.ay = 200;
  }

  if (e.key === "w") {
    glider2.ay = -200;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowDown") {
    glider.ay = 0;
  }

  if (e.key === "ArrowUp") {
    glider.ay = 0;
  }
  if (e.key === "s") {
    glider2.ay = 0;
  }

  if (e.key === "w") {
    glider2.ay = 0;
  }
});
