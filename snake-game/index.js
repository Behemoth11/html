class Body {
  constructor(config) {
    this.row = config.row;
    this.col = config.col;
    this.color = config.color;
  }
}
class Scene {
  constructor(config) {
    this.bodies = [];
    this.composites = [];

    this.cell_width = config.cell_width;
    this.cell_height = config.cell_height;

    this.canvas = config.canvas;
    this.ctx = config.canvas.getContext("2d");

    this.rows = config.rows;
    this.columns = config.columns;

    this.init();
  }

  init() {
    this.canvas.height = this.cell_height * this.rows;
    this.canvas.width = this.cell_width * this.columns;
  }

  render() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.bodies.forEach((body) => this.drawBody(body));
    this.composites.forEach((composite) =>
      composite.forEach((body) => this.drawBody(body))
    );
  }

  addBody(body) {
    this.bodies.push(body);
    return this;
  }
  addComposite(composite) {
    this.composites.push(composite);
    return this;
  }

  drawBody(body) {
    this.ctx.fillStyle = body.color;
    this.ctx.fillRect(
      body.col * this.cell_width,
      body.row * this.cell_height,
      this.cell_width,
      this.cell_height
    );
  }
}

class Snake {
  constructor(head, config) {
    this.config = config;
    this.composite = [head];

    this.speed = 10;
    this.alive = false;
    this.row_direction = 0;
    this.column_direction = 1;
    this.eventsCallBack = {};
  }

  get head() {
    return this.composite[this.composite.length - 1];
  }

  eat(body) {
    this.composite.push(body);
  }

  move(column_delta, row_delta) {
    let tail = this.composite.shift();

    let next_row =
      (this.head?.row ?? tail.row) + (row_delta || this.row_direction);
    let next_col =
      (this.head?.col ?? tail.col) + (column_delta || this.column_direction);

    next_row = (next_row + this.config.rows) % this.config.rows;
    next_col = (next_col + this.config.columns) % this.config.columns;

    tail.row = next_row;
    tail.col = next_col;

    this.composite.push(tail);

    this.checkSelfHit();

    this.dispatchEvent("move", {});
  }

  checkSelfHit() {
    for (const section of this.composite.slice(0, -2)) {
      if (section.col === this.head.col && section.row === this.head.row) {
        this.dispatchEvent("selfHit", {});
        return true;
      }
    }

    return false;
  }

  addEventListener(name, cb) {
    (this.eventsCallBack[name] = this.eventsCallBack[name] ?? []).push(cb);
  }

  dispatchEvent(name, data) {
    if (!this.eventsCallBack[name]) return;
    this.eventsCallBack[name].forEach((cb) => cb(data));
  }

  birth() {
    this.interval = setInterval(() => {
      this.move();
    }, 1000 / this.speed);
  }
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const canvas = document.getElementById("scene");

let scene = new Scene({
  rows: 45,
  columns: 60,
  cell_width: 40,
  canvas: canvas,
  cell_height: 40,
});

let food = new Body({
  name: "food",

  row: 5,
  col: 6,
  color: "red",
});

let snake = new Snake(
  new Body({
    name: "snake",

    row: 0,
    col: 0,
    color: "#2ce89d",
  }),
  scene
);

scene.addBody(food);
scene.addComposite(snake.composite);

scene.render();

snake.move(1, 1);

let start = () => {
  scene.render();
  requestAnimationFrame(start);
};

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    snake.row_direction = 0;
    snake.column_direction = -1;
  } else if (e.key === "ArrowUp") {
    snake.row_direction = -1;
    snake.column_direction = 0;
  } else if (e.key === "ArrowRight") {
    snake.row_direction = 0;
    snake.column_direction = 1;
  } else if (e.key === "ArrowDown") {
    snake.row_direction = 1;
    snake.column_direction = 0;
  }
});

snake.birth();

snake.addEventListener("move", () => {
  if (snake.head.col === food.col && snake.head.row === food.row) {
    food.color = "#2ce89d";

    snake.eat(food);
    food = new Body({
      name: "food",

      row: getRandomNumber(0, scene.rows),
      col: getRandomNumber(0, scene.columns),
      color: "red",
    });

    scene.addBody(food);
  }
});

snake.addEventListener("selfHit", () => {
  console.log("I just hit myself ");
});

start();
