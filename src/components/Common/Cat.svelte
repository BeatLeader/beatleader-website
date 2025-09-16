<script>
	// https://github.com/Lyall-A/Neko-JS

	(() => {
		class Neko extends EventTarget {
			constructor(parentElement, options = {}) {
				super();

				// Options
				this.parentElement = parentElement || this.parentElement;
				this.spritePath = options.spritePath || this.spritePath;
				this.speed = options.speed || this.speed;
				this.framesPerSecond = options.framesPerSecond || this.framesPerSecond;
				this.position = options.position || this.position;
				this.minimumCursorDistance = options.minimumCursorDistance ?? this.minimumCursorDistance;
				this.cursorWait = options.cursorWait ?? this.cursorWait;
				this.spriteWidth = options.spriteWidth || this.spriteWidth;
				this.spriteHeight = options.spriteHeight || this.spriteHeight;
				this.xOffset = options.xOffset ?? this.xOffset;
				this.yOffset = options.yOffset ?? this.yOffset;
				this.xMax = options.xMax || this.xMax;
				this.yMax = options.yMax || this.yMax;
				this.xStart = options.xStart ?? this.xStart;
				this.yStart = options.yStart ?? this.yStart;
				this.idleTime = options.idleTime ?? this.idleTime;
				this.idleAnimations = options.idleAnimations || this.idleAnimations;
				this.sprites = options.sprites || this.sprites;

				this.start();
			}

			parentElement = document.body; // Parent element
			spritePath =
				'data:image/gif;base64,R0lGODlhAAGAAJECAAAAAP///wAAAAAAACH5BAEAAAIALAAAAAAAAYAAAAL/lH8AtizbkJy02ouz3ljxD4biSDJBACXPWrbuCwIoTNd2fEKKp0faDvTdhiTZjIgkel4y4Cm3wz0VKGGyEi1ZJcbj9etqbqXdJ/QjLkOz4ESuKIybl7exiF6ftpq5uf6nBmXm1fZwFtLElRBICJPIVDVUZgc45ffWATFHNVnI9cdhFGcyOKc1IQp5OMJmuMnaNQmaIds36+naeBGrKFqKedfIuzdI2bH2EGiM9ftrB5RbfIubu0w15aOJ0rxskUo6LfWKWMyom+lUDk0huuMcDrjOiu3NvWjpXPSnHMpmroOm2TZToQSWehbLXJ9uE/wgkHdsUxxlmK5hK6bvYr4f/9gsHnzEUWAnNNdi0duV8B+wGDIk9NnwLwKjb9o8LoRIyyDBkDoFMYwm8tyuKmrcWVOIryKeoewCMKCEdIbKI9p6nuSpk6HCoiBzJr3082nPpewo8im3EkuQh06gjo0q1US6rDCDwmt68GOkukmLInKn7idcaUIRlGJx0a1ViZ1kxtwYEe1OrAMlF/4kslVBuv0Wf2OZ7e5gqz22GrSWF2NAsAknDyXalxxpcadX0TIa5CrmxSLBcRvLlgvgTWtwohpeWZDreu/SRp692m5Xb75sybIymlurILU4G5KjV+NdoPlsap27drNn2Vlto7qk3A/45tqZES25/vNTTh2Ri/82upFf4gzD13rsGfjeV6c5pl1WCLFlU2bTmBehampZBttykVnUDQ+8SRXWVAfZZ8tbbqjjWYjZ/QcYhyOiUyE/6r041FwO6vccYRbultyCDbRTUoyTqPhhhygKSBl8zjH3EVYVYihYbTueqOA7j4hx337c9UhkFc5odhx5Ch4lZolLCkdeKmTx+OGZTH7kEXZ5+TfQlZzE4+V4Wtqo54lxKnmZK39+teZD8eWZpzHDpYNeoa9BRiCVhJp00yJkRPqeixIViGhreg7Z10hvagoZSjIBA2Z0O+IoZlHSTPfXfsc8GRZQlHKZ462ivlnZVqkyWSuMkbIqoiWcwPoFd9z/gdYXPspusWiz9xmXjK5cchhdsHzJAa12WyZKTQ3mrVFcqckQ1iKdwriaIZzBsuqIc4V+y5h12oar1rOl6Ysdv9Xy26++/yoLBxLwwkTwwI7iy3DDDhMT6MMST0wxvgtXjHHGuKQg01OOXKwxSyGPjMYKHR+c77f3kvzJyiwzoW0U+wo6I3ovQ+wyxr+SAQtyy97GX3Ix/2zDzmoZ6qYWRNfBIcjAzjPVg6TuyoE0RSfUjw7lwJGFMk4jrG7EeIl9odALZUKohjAZIu5MHYZNNps/apqzb8UZ/drKpPaKGn1xN9QSDVEdNfgd2JKCsqpbGx7k12yl7d7Yp+kzEd6S/9tjqplqF9hi5AfWp/iUXgGX45eWfyKAU4a9FDrmwX2neZ+PkltnP4uM5jhcguUWGMhIcfV2em7Q5p1ccp1FYzDQ5fQjosXPPnkly0OPoAW/3J57m3NXJJ7orduzsJqxa24kb+dVx3dn2pMwyLa/oYgqhtsIz6mDhODhaY/69z0+1fX4ZxTiTS8MwCqWjM6lvSh55gx3kpSO9Bcxk7gKU9Qx0YyqR4xuvaFYkEJgkS74vviExi4QVBSlTqgbU3nNcXbD4NqQpsHmhdB1+2lQ8kpHHB2NMIQHLMtCpDU/z7HJXKNbX0BOJS/ukTA1lUsNDXEIwdr5CXL745XZujMe3P+RJIfPiwjv9uIGGS4RXZfTnfoAlTz0daeHwvki7fqzsxWFqEq9AZp85PO6Fk7qhJIbTK3YVcfO2WtvcfMjCKO3reyYkHwTpF6JgDQO4YyPiFCkoRy9RyJEFpF0nEvRo3CnGOIYsixPalLNphYXQZEGk5d7YlnKBD6tTNKUJAIlSso1ygqaL3RqBKMfY6MeQCrqPilKnJ+0mElQIuSR4ekT8gaYNydOB0voctaAdPicUnbvPM5TTjvKSBpkqbJdyKBfjQ4lHgUWro30CmLSxsYu37WJlT4cF6NaSU20iJOaXPkb9vi0QQoyJ0JiGNUd/Wk3ruCpXMRExhZ9FtAk6hD/lWtaQhpaFAxCboeF1VjUMCf1zrJZiSRIdMy9AJgeYvmNS/NDh5+g9g9xMUacMBTkSavVkZA+TRXFOVqCnGgsLJFJVlwTmEyVGEGTFvQOJoOGMXcKM2rVD47p0unNoPrUfBXBZCrIKl7qpgQ3MvSbV81ISS3GVQc00HBXfdaeOFrW42QDrKxIK1fpGte86pWAJ2PBXv8K2MBeQapME6xhw6SzdiZMpng9LEnygFCgmfN/z5QPTZXX2ImdzqxFs2pn4hQS/DjLqzx5FztKprQmOlRw/tOCZ6lDpwB6kYqkveUthskt283jft6C66gE99pMdlOIUzQTHyG2OL/a56x1/4nZbdsZ3E8CN7I/nd+fHFXZoOTsdw7Aquxolq181bGo/SFvljLCzKRQNrZtQS4ZQymVze1GgULRZnQdeMOpynd0KqFWdn+z3felQLgAvE0koSrJcDpmk66s5HfhaTp49dK490WaNJ9BTth8NL/3cBMoqRIoRR6SksxbUArDiFLZupaLxL2O0KKZ3BpuDpDvTdqKxCZHMnjrxMUVMOOClkOaVoduMLYQraxIERHObib79Q2Ts2hRNNISnnE63BkXiJAhd6TIGFlndanIYSpVFnnlc6exsojOIHrNwWEWbm+l2EfyWbGZ4x1irzSZ4Do5i8cW1rN1ZjzLBrdS0G4erv+SkynnZMKtzkO8FSXxY60fgvGnke4VlxdUEFpd1s507CmwjOvIeRYmyWazTqMPGrsxOPqZAhVLFOnpQxZPOo+w7PSntslgUWNYh/DBkbLgR1VVMzKe/ws0QuOJSZD8kqoLJQrYbpzsiYq2TtiF5nJXeY5p4zlJ6AuH+LDNO/qeNGxbIfAHQw1rVy97KTd2bjW9l78bzfWC7jbxl768bjZbFci1IQsHH9znP0c7gStOd55vxOFKb3u+2PSKRjUyHynfN8lsDLiDCt7m48i6off86p71yd+Gz+rh5Ip4oOv9cfkCNFHjhiVAoHfRjUK6lkJb1tvIJzsA4fwmO2woiXP/zeg5u3Uzg/LmqNIQ2l2z2uCuHtNqaAxnMeMX4BYH6O6EOeujh0pDnvrjR4ue9XOCLmu+quhKYopepE4cwLLstdNJ6TFJDLK2iGvagEFj92rz9m7u7fnQ/AU2IKaEsEk4Fh18qyanKvfHRgJPYynYajCMK0M0zizYpnt3jm1MTtRdruct5i+AbfZlBe2r5TF7NZQ49rCaV+viLVbh1cueqZl/fcN8O/vc676NTMN9rHYviQVbSmd3I7xcqzx6HJx+96VXSueV0J8mc3r54AX+UWuCuB/UlTa+MH6Ha+F7BPvutKzF62KfDl6vjgIVD1FeeiMRPtq2bWt4m+bzOxx2/5K+aLJ9Lkk0tBJGLdNdB7JG/LNG0xVhXvRSSnNvmLVltqJ13SQY2UeBaYd26MZ0bGY0BBJ5QEd1xYVEzjZngmZ28SMvbddFx7dC4Td11AZfVUFdZmQ4g5Rzu0QdPAKD8yZZMoiB0gd03ccrBXaDnJZx15ZhZcZJQwg8XUY4D1SEYkYo8WIlQmZtAWhxQdeDNehCWUg20NaFKcaCLWhllCZyXyVGWzh89vVdudRJvZYkFiQ9Y/cXOtc9ozYmt/ZGnaYfh5dhC+dxTJQyDOeGWkKEWJgyPrM0cWg+u8ZS70RqUWRlzWds0td9r/JajmZp+vaE6iYl2UNwjOiHLaiH1f9Qd1hkiAkyYbXFhoOWhJfWHCi4cau1XjQIXytFEDRRJdoUJZW2aS0jWirGiq04UGOhU78DJ/qlcrPEXenXHj/XFC5mLAIEa340JM2FZR74diMWYsrIGVfSjAemiEf4LqcoitKkjeSoR0D1LnbncDllazo4OBn4OHCof7IobClyiefGhdSGXjfnjhIHisKYCR6EaXCFKciiho/0PYTWdPKWdhG0SgR1WmT2j5G1aA9IPMx1cJ0ojeQoRy4zE9gYVEFyISgkj3kmTCinBwfzYf6UY4WWGRiXbv3Ea/kHO6kWeyRnkyMYdfPYDnqBeGjYUV9CXANZbuHjVBQyZDBpTQXFJ0yPZRrzgkuSoTe/w4ge4i7eV1NK4n+ZFk/7lF1dyYCA4olgJ5bHNE4lt13p4jv4M3leAotT01oDlRtzo0s+B1b/dTZOoitUQxNilXx5w1MgRxkK55Ko4jQx54MOZ3f7VpO4giakNJeykZcAkzWCF2yXF3doA2KxV11udD6YKYtkF4YV+DCTJ0hRaDAmeH+Y4XgIgy7atpOeQHeFF3qiR30VWJsKCEPPRjCWqVm5yXxzZXlLdQ/CaX3JCXqvpJzN6ZzUUAAAOw=='; // Path of neko.gif, can be base64 instead
			speed = 30; // Speed of neko
			framesPerSecond = 5; // Animation FPS
			position = 'absolute'; // "absolute" or "fixed"
			minimumCursorDistance = 32; // Minimum distance from cursor before moving
			cursorWait = 1000; // Time to wait before moving to cursor
			spriteWidth = 32; // Default width of each sprite
			spriteHeight = 32; // Default height of each sprite
			xOffset = -this.spriteWidth; // X position offset
			yOffset = -this.spriteHeight; // Y position offset
			xMax = null; // Highest X value
			yMax = null; // Highest Y value
			xStart = 40 - this.xOffset; // X start position
			yStart = 16 - this.yOffset; // Y start position
			idleTime = 5000; // Time to wait before entering "idle" mode (allowing for the below animations to play)
			// Animations for "idle" mode with a x% chance of triggering per second
			idleAnimations = [
				{spriteName: 'scratchSelf', duration: 3000, chance: 20},
				{spriteName: 'tired', duration: 2000, chance: 20},
				{spriteName: 'sleeping', duration: 30000, chance: 20},
				{spriteName: 'scratchWallU', duration: 7000, chance: 20, scratchWall: 'U'}, // Works
				{spriteName: 'scratchWallR', duration: 7000, chance: 20, scratchWall: 'R'}, // Doesn't work
				{spriteName: 'scratchWallD', duration: 7000, chance: 20, scratchWall: 'D'}, // Doesn't work
				{spriteName: 'scratchWallL', duration: 7000, chance: 20, scratchWall: 'L'}, // Goes off visible screen
			];
			// All sprites
			sprites = {
				sit: [
					{
						x: this.spriteWidth * 3,
						y: this.spriteHeight * 3,
					},
				],
				alert: [
					{
						x: this.spriteWidth * 7,
						y: this.spriteHeight * 3,
					},
				],
				scratchSelf: [
					{
						x: this.spriteWidth * 5,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 6,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 7,
						y: this.spriteHeight * 0,
					},
				],
				tired: [
					{
						x: this.spriteWidth * 3,
						y: this.spriteHeight * 2,
					},
				],
				sleeping: [
					{
						x: this.spriteWidth * 2,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 2,
						y: this.spriteHeight * 1,
					},
				],
				scratchWallU: [
					{
						x: this.spriteWidth * 0,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 0,
						y: this.spriteHeight * 1,
					},
				],
				scratchWallR: [
					{
						x: this.spriteWidth * 2,
						y: this.spriteHeight * 2,
					},
					{
						x: this.spriteWidth * 2,
						y: this.spriteHeight * 3,
					},
				],
				scratchWallD: [
					{
						x: this.spriteWidth * 7,
						y: this.spriteHeight * 1,
					},
					{
						x: this.spriteWidth * 6,
						y: this.spriteHeight * 2,
					},
				],
				scratchWallL: [
					{
						x: this.spriteWidth * 4,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 4,
						y: this.spriteHeight * 1,
					},
				],
				runningUL: [
					{
						x: this.spriteWidth * 1,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 1,
						y: this.spriteHeight * 1,
					},
				],
				runningU: [
					{
						x: this.spriteWidth * 1,
						y: this.spriteHeight * 2,
					},
					{
						x: this.spriteWidth * 1,
						y: this.spriteHeight * 3,
					},
				],
				runningUR: [
					{
						x: this.spriteWidth * 0,
						y: this.spriteHeight * 2,
					},
					{
						x: this.spriteWidth * 0,
						y: this.spriteHeight * 3,
					},
				],
				runningR: [
					{
						x: this.spriteWidth * 3,
						y: this.spriteHeight * 0,
					},
					{
						x: this.spriteWidth * 3,
						y: this.spriteHeight * 1,
					},
				],
				runningDR: [
					{
						x: this.spriteWidth * 5,
						y: this.spriteHeight * 1,
					},
					{
						x: this.spriteWidth * 5,
						y: this.spriteHeight * 2,
					},
				],
				runningD: [
					{
						x: this.spriteWidth * 7,
						y: this.spriteHeight * 2,
					},
					{
						x: this.spriteWidth * 6,
						y: this.spriteHeight * 3,
					},
				],
				runningDL: [
					{
						x: this.spriteWidth * 5,
						y: this.spriteHeight * 3,
					},
					{
						x: this.spriteWidth * 6,
						y: this.spriteHeight * 1,
					},
				],
				runningL: [
					{
						x: this.spriteWidth * 4,
						y: this.spriteHeight * 2,
					},
					{
						x: this.spriteWidth * 4,
						y: this.spriteHeight * 3,
					},
				],
			};

			nekoElement = null;
			animationFrameId = null;
			lastAnimationFrame = null;
			lastCursorMove = null;
			currentSprite = null;
			x = null;
			y = null;
			xTarget = null;
			yTarget = null;
			get pageWidth() {
				return document.documentElement.scrollWidth;
			}
			get pageHeight() {
				return document.documentElement.scrollHeight;
			}

			start() {
				this.stop();

				this.nekoElement = document.createElement('div');

				this.nekoElement.style.position = this.position === 'fixed' ? 'fixed' : 'absolute';
				this.nekoElement.style.backgroundImage = `url(${this.spritePath})`;
				this.nekoElement.style.pointerEvents = 'none';
				this.nekoElement.style.zIndex = '99999';
				this.nekoElement.style.imageRendering = 'pixelated';
				this.nekoElement.style.filter = 'invert(1)';

				this.parentElement.appendChild(this.nekoElement);

				this.setSprite('sit');
				this.setPosition(this.xStart, this.yStart);

				// Cursor event
				addEventListener('mousemove', ev => {
					const cursorX = this.position === 'fixed' ? ev.clientX : ev.pageX;
					const cursorY = this.position === 'fixed' ? ev.clientY : ev.pageY;

					if (this.lastCursorMove && this.lastCursorMove.x === cursorX && this.lastCursorMove.y === cursorY) return;

					this.lastCursorMove = {
						x: cursorX,
						y: cursorY,
						date: Date.now(),
					};

					const distance = Math.sqrt((this.lastCursorMove.x - this.x) ** 2 + (this.lastCursorMove.y - this.y) ** 2);
					if (this.currentSprite.spriteName === 'sit' && distance >= this.minimumCursorDistance) {
						// Set alert if outside minimum distance
						this.setSprite('alert');
					}
				});

				// Loop
				this.loop();
				this.animationFrameId = requestAnimationFrame(this.loop);
			}

			stop() {
				this.nekoElement?.remove();

				if (this.animationFrameId) {
					cancelAnimationFrame(this.animationFrameId);
					this.animationFrameId = null;
				}

				this.lastAnimationFrame = null;
				this.lastCursorMove = null;
				this.currentSprite = null;
				this.x = null;
				this.y = null;
				this.xTarget = null;
				this.yTarget = null;
			}

			loop = () => {
				const date = Date.now();
				const frameTime = this.lastAnimationFrame ? date - this.lastAnimationFrame : 0;
				this.lastAnimationFrame = date;

				// Reset sprite after duration
				if (this.currentSprite.duration && date > this.currentSprite.spriteDate + this.currentSprite.duration) {
					this.setSprite('sit');
				}

				// Update sprite frame
				if (date >= this.currentSprite.frameDate + 1000 / this.framesPerSecond) {
					const frameIndex = this.currentSprite.frameIndex + 1;
					this.setSprite(this.currentSprite.spriteName, frameIndex >= this.currentSprite.sprite.length ? 0 : frameIndex);
				}

				// Idle animation
				if (date - this.currentSprite.spriteDate > this.idleTime) {
					if (this.currentSprite.spriteName === 'sit') {
						const randomAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
						// x% chance every second
						if (Math.random() * 100 < (randomAnimation.chance / 1000) * frameTime) {
							if (randomAnimation.scratchWall) {
								const xScroll = this.position === 'absolute' ? window.scrollX : 0;
								const yScroll = this.position === 'absolute' ? window.scrollY : 0;
								const viewportWidth = this.position === 'fixed' ? window.innerWidth : document.documentElement.clientWidth;
								const viewportHeight = this.position === 'fixed' ? window.innerHeight : document.documentElement.clientHeight;
								const maxX = this.xMax ?? this.pageWidth;
								const maxY = this.yMax ?? this.pageHeight;
								const visibleRight = Math.min(xScroll + viewportWidth, maxX);
								const visibleBottom = Math.min(yScroll + viewportHeight, maxY);
								const xTarget =
									randomAnimation.scratchWall === 'U' || randomAnimation.scratchWall === 'D'
										? xScroll + Math.floor(Math.random() * Math.max(1, visibleRight - xScroll))
										: randomAnimation.scratchWall === 'L'
											? xScroll - this.xOffset
											: randomAnimation.scratchWall === 'R'
												? visibleRight
												: null;
								const yTarget =
									randomAnimation.scratchWall === 'L' || randomAnimation.scratchWall === 'R'
										? yScroll + Math.floor(Math.random() * Math.max(1, visibleBottom - yScroll))
										: randomAnimation.scratchWall === 'U'
											? yScroll - this.yOffset
											: randomAnimation.scratchWall === 'D'
												? visibleBottom
												: null;

								this.moveTo(xTarget, yTarget);

								const sitListener = () => {
									this.removeEventListener('sit', sitListener);
									this.setSprite(randomAnimation.spriteName, 0, randomAnimation.duration);
								};
								this.addEventListener('sit', sitListener);
							} else {
								this.setSprite(randomAnimation.spriteName, 0, randomAnimation.duration);
							}
						}
					}
				}

				// Start running to cursor
				if (this.lastCursorMove && date - this.lastCursorMove.date >= this.cursorWait) {
					const distance = Math.sqrt((this.lastCursorMove.x - this.x) ** 2 + (this.lastCursorMove.y - this.y) ** 2);
					if (distance >= this.minimumCursorDistance) {
						// Cursor is outside minimum distance
						this.moveTo(this.lastCursorMove.x, this.lastCursorMove.y);
					} else {
						// Cursor is inside minimum distance
						if (this.currentSprite.spriteName === 'alert') this.setSprite('sit');
					}
					this.lastCursorMove = null;
				}

				// Take steps to target
				if (this.xTarget !== null && this.yTarget !== null) {
					const xDistance = this.xTarget - this.x;
					const yDistance = this.yTarget - this.y;
					const distance = Math.sqrt(xDistance ** 2 + yDistance ** 2);

					const xDirection = xDistance / distance;
					const yDirection = yDistance / distance;

					const xMove = xDirection * (this.speed / 100) * frameTime;
					const yMove = yDirection * (this.speed / 100) * frameTime;

					if (distance) {
						// Set running animation
						this.setSprite(
							`running${yDirection > 0.5 ? 'D' : yDirection < -0.5 ? 'U' : ''}${xDirection > 0.5 ? 'R' : xDirection < -0.5 ? 'L' : ''}`
						);

						// Move neko
						this.setPosition(
							Math.abs(xDistance) > xMove ? this.x + xMove : this.xTarget,
							Math.abs(yDistance) > yMove ? this.y + yMove : this.yTarget
						);
					}

					// Stop running if at target
					if (this.x === this.xTarget && this.y === this.yTarget) {
						this.xTarget = null;
						this.yTarget = null;

						this.setSprite('sit');
					}
				}

				this.animationFrameId = requestAnimationFrame(this.loop);
			};

			setSprite(spriteName, frameIndex, duration) {
				const sprite = this.sprites[spriteName];
				const frame = sprite[frameIndex ?? 0];
				const sameSprite = this.currentSprite?.sprite === sprite;
				const sameFrame = this.currentSprite?.frame === frame;

				if (sameSprite && (frameIndex === undefined || sameFrame)) return;

				this.nekoElement.style.backgroundPositionX = `-${frame.x}px`;
				this.nekoElement.style.backgroundPositionY = `-${frame.y}px`;
				this.nekoElement.style.width = `${frame.width || this.spriteWidth}px`;
				this.nekoElement.style.height = `${frame.height || this.spriteHeight}px`;

				this.currentSprite = {
					spriteName,
					frameIndex: frameIndex ?? 0,
					sprite,
					frame,
					spriteDate: sameSprite ? this.currentSprite.spriteDate : Date.now(),
					frameDate: sameFrame ? this.currentSprite.frameDate : Date.now(),
					duration: duration || (sameSprite ? this.currentSprite?.duration : undefined),
				};

				if (!sameSprite) this.dispatchEvent(new CustomEvent(spriteName, this.currentSprite));
			}

			setPosition(x, y) {
				this.x = Math.min(this.xMax ?? this.pageWidth, Math.max(0, x));
				this.y = Math.min(this.yMax ?? this.pageHeight, Math.max(0, y));
				this.nekoElement.style.left = `${Math.round(this.x + this.xOffset)}px`;
				this.nekoElement.style.top = `${Math.round(this.y + this.yOffset)}px`;
			}

			moveTo(x = this.x, y = this.y) {
				this.xTarget = Math.min(this.xMax ?? this.pageWidth, Math.max(0, x));
				this.yTarget = Math.min(this.yMax ?? this.pageHeight, Math.max(0, y));
			}
		}

		new Neko(document.querySelector(document.currentScript?.getAttribute('data-parent')) || document.body, {
			spritePath: document.currentScript?.getAttribute('data-sprite-path') || `/assets/clans/neko.gif`,
			speed: parseFloat(document.currentScript?.getAttribute('data-speed')),
			framesPerSecond: parseInt(document.currentScript?.getAttribute('data-fps'), 10),
			position: document.currentScript?.getAttribute('data-position'),
		});
	})();
</script>
