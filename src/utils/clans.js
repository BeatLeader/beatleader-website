export function playersTitle(tag, count) {
	switch (tag) {
		case 'DUH':
			return 'prayer' + (count > 1 ? 's' : '');
		case 'JML':
			return 'jamal' + (count > 1 ? 's' : '');
		case 'OOTK':
			return 'varma' + (count > 1 ? 'a' : '');

		default:
			return 'player' + (count > 1 ? 's' : '');
	}
}

export function rankLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko Ränkki';

		default:
			return 'Average Rank';
	}
}

export function accLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko Äcc';

		default:
			return 'Average Acc';
	}
}

export function ppLabel(tag) {
	switch (tag) {
		case 'JML':
			return 'Jamal';
		case 'OOTK':
			return 'Ootko';

		default:
			return 'Total PP';
	}
}

export function capturesLabel(tag) {
	switch (tag) {
		default:
			return 'Maps Captured';
	}
}

export function rankedPoolPercentLabel(tag) {
	switch (tag) {
		default:
			return 'Ranked % Captured';
	}
}

export function ppIcon(tag) {
	switch (tag) {
		case 'OOTK':
			return 'coolpepe-icon';

		default:
			return null;
	}
}

const clansChangingValues = ['WYSI'];

export function changingValuesClan(clans) {
	return clans.find(element => clansChangingValues.includes(element.tag))?.tag;
}

export function rankValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 727;

		default:
			return value;
	}
}

export function accValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 96.41;

		default:
			return value;
	}
}

export function ppValue(tag, value) {
	switch (tag) {
		case 'WYSI':
			return 727;

		default:
			return value;
	}
}

export function capturesValue(tag, value) {
	switch (tag) {
		default:
			return value;
	}
}

export function rankedPoolPercentValue(tag, value) {
	switch (tag) {
		default:
			return value;
	}
}

export function toggleRandomImageOnHover(playerPage, enable) {
	const onChange = () => {
		const contentBoxes = playerPage.querySelectorAll('.content-box:not(.profile-box)');
		contentBoxes.forEach(box => {
			box.removeEventListener('mouseenter', handleMouseEnter);
			box.removeEventListener('touchstart', handleTouchStart);
			if (playerPage.imagesEnable) {
				box.addEventListener('mouseenter', handleMouseEnter);
				box.addEventListener('touchstart', handleTouchStart);
			}
		});

		const fakeBoxes = playerPage.querySelectorAll('.saba-fake-box');
		fakeBoxes.forEach(fakeBox => {
			fakeBox.parentElement.removeChild(fakeBox);
		});
	};

	if (!playerPage.observer) {
		playerPage.observer = new MutationObserver(mutations => {
			const shouldUpdate = mutations.some(
				mutation =>
					mutation.type === 'childList' &&
					!Array.from(mutation.addedNodes)
						.concat(Array.from(mutation.removedNodes))
						.some(node => node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'svg')
			);
			if (shouldUpdate) {
				onChange();
			}
		});

		playerPage.observer.observe(playerPage, {childList: true, subtree: false});
	}

	playerPage.imagesEnable = enable;

	function handleMouseEnter(event) {
		if (event.currentTarget.parentElement.imagesEnable && !event.currentTarget.showingImage) {
			showImage(event.currentTarget, false);
		}
	}

	function handleTouchStart(event) {
		if (event.currentTarget.parentElement.imagesEnable && !event.currentTarget.showingImage) {
			showImage(event.currentTarget, true);
		}
	}

	function showImage(box, isTouch) {
		box.showingImage = true;
		const parentBox = box.parentElement;
		const fakeBox = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		fakeBox.setAttribute('width', box.clientWidth);
		fakeBox.setAttribute('height', box.clientHeight);
		fakeBox.style.position = 'absolute';
		fakeBox.style.top = `${box.offsetTop}px`;
		fakeBox.style.left = `${box.offsetLeft}px`;
		fakeBox.style.pointerEvents = 'none';
		fakeBox.style.overflow = 'visible';
		fakeBox.classList.add('saba-fake-box');
		fakeBox.style.zIndex = '3';

		const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
		mask.setAttribute('id', 'mask');
		const outerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		outerRect.setAttribute('x', -box.clientWidth);
		outerRect.setAttribute('y', -box.clientHeight);
		outerRect.setAttribute('width', box.clientWidth * 3);
		outerRect.setAttribute('height', box.clientHeight * 3);
		outerRect.setAttribute('fill', 'white');
		const innerRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		innerRect.setAttribute('x', 0);
		innerRect.setAttribute('y', 0);
		innerRect.setAttribute('width', box.clientWidth);
		innerRect.setAttribute('height', box.clientHeight);
		const borderRadius = getComputedStyle(box).borderRadius.split(' ');
		if (borderRadius.length === 1) {
			innerRect.setAttribute('rx', borderRadius[0]);
			innerRect.setAttribute('ry', borderRadius[0]);
		} else {
			innerRect.setAttribute('rx', '0');
			innerRect.setAttribute('ry', '0');
		}
		innerRect.setAttribute('fill', 'black');
		mask.appendChild(outerRect);
		mask.appendChild(innerRect);
		fakeBox.appendChild(mask);

		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('mask', 'url(#mask)');

		const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
		const firstNumber = Math.floor(Math.random() * 10) + 1;
		let imagePath;
		if (firstNumber === 10) {
			const secondNumber = Math.floor(Math.random() * 3) + 1;
			imagePath = `/assets/clans/SABA-r${secondNumber}.webp`;
		} else {
			const secondNumber = Math.floor(Math.random() * 5) + 1;
			imagePath = `/assets/clans/SABA-${secondNumber}.webp`;
		}
		img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePath);
		const size = 60;
		img.setAttribute('width', size);
		img.setAttribute('height', size);

		let x, y, angle;
		if (isTouch) {
			const isTop = Math.random() < 0.5;
			x = box.clientWidth * Math.random();
			y = isTop ? -(size - size / 10) : box.clientHeight - size / 10;
			angle = isTop ? 0 : 180;
		} else {
			const isLeft = Math.random() < 0.5;
			const distance = box.clientHeight * Math.random();
			x = isLeft ? -(size - size / 10) : box.clientWidth - size / 10;
			y = distance;
			const centerX = box.clientWidth / 2;
			const centerY = box.clientHeight / 2;
			angle = Math.atan2(centerY - y, centerX - x) * (180 / Math.PI) - 90;
		}

		img.setAttribute('x', x);
		img.setAttribute('y', y);

		let startTime;
		const duration = 300;

		const animate = timestamp => {
			if (!startTime) startTime = timestamp;
			const progress = timestamp - startTime;
			const easeProgress = Math.min(progress / duration, 1);
			const translateY = (1 - easeProgress) * size;

			img.setAttribute('transform', `rotate(${angle} ${x + size / 2} ${y + size / 2}) translate(0 ${translateY})`);

			if (progress < duration) {
				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);

		g.appendChild(img);
		fakeBox.appendChild(g);
		parentBox.appendChild(fakeBox);

		const removeImage = () => {
			startTime = null;
			requestAnimationFrame(function removeAnimate(timestamp) {
				if (!startTime) startTime = timestamp;
				const progress = timestamp - startTime;
				const easeProgress = Math.min(progress / duration, 1);
				const translateY = easeProgress * size;

				img.setAttribute('transform', `rotate(${angle} ${x + size / 2} ${y + size / 2}) translate(0 ${translateY})`);

				if (progress < duration) {
					requestAnimationFrame(removeAnimate);
				} else if (!fakeBox.removed) {
					fakeBox.removed = true;
					box.showingImage = false;
					parentBox.removeChild(fakeBox);
				}
			});
		};

		if (isTouch) {
			setTimeout(removeImage, 1400);
		} else {
			box.addEventListener('mouseleave', removeImage, {once: true});
		}
	}
}

export function toggleEffectImageOnClick(playerPage, enable) {
	const onChange = () => {
		const contentBoxes = playerPage.querySelectorAll('.content-box:not(.profile-box)');
		const sortedBoxes = Array.from(contentBoxes)
			.sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y)
			.slice(0, 3);
		const randomBox = sortedBoxes[Math.floor(Math.random() * sortedBoxes.length)];
		showEffectImage(randomBox);

		// const effectImages = playerPage.querySelectorAll('.effect-image-genx');
		// effectImages.forEach(effectImage => {
		// 	effectImage.parentElement.removeChild(effectImage);
		// });
	};

	var changeTimeout = null;

	if (!playerPage.observerEffect) {
		playerPage.observerEffect = new MutationObserver(mutations => {
			const shouldUpdate = mutations.some(
				mutation =>
					mutation.type === 'childList' &&
					!Array.from(mutation.addedNodes)
						.concat(Array.from(mutation.removedNodes))
						.some(node => node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'svg')
			);
			if (shouldUpdate) {
				clearTimeout(changeTimeout);
				changeTimeout = setTimeout(() => {
					onChange();
				}, 1000);
			}
		});

		playerPage.observerEffect.observe(playerPage, {childList: true, subtree: false});
	}

	playerPage.effectEnable = enable;

	function handleMouseEnter(event) {
		if (event.currentTarget.parentElement.effectEnable && !event.currentTarget.showingEffect) {
			showEffectImage(event.currentTarget, false);
		}
	}

	function handleTouchStart(event) {
		if (event.currentTarget.parentElement.effectEnable && !event.currentTarget.showingEffect) {
			showEffectImage(event.currentTarget, true);
		}
	}

	function showEffectImage(box) {
		box.showingEffect = true;

		// Cache for base64 encoded images
		const imageCache = {};
		const imagePaths = [
			'/assets/clans/GENX-in-1.webp',
			'/assets/clans/GENX-out-1.webp',
			'/assets/clans/GENX-scroll-1.webp',
			'/assets/clans/GENX-scroll-2.webp',
			...Array.from({length: 5}, (_, i) => `/assets/clans/GENX-idle-${i + 1}.webp`),
		];

		Promise.all(
			imagePaths.map(path => {
				return new Promise((resolve, reject) => {
					fetch(path)
						.then(response => response.blob())
						.then(blob => {
							const reader = new FileReader();
							reader.onloadend = () => {
								imageCache[path] = reader.result;
								resolve();
							};
							reader.onerror = reject;
							reader.readAsDataURL(blob);
						})
						.catch(reject);
				});
			})
		)
			.then(() => {
				const effectImage = document.createElement('img');
				effectImage.src = imageCache['/assets/clans/GENX-in-1.webp'];
				effectImage.classList.add('effect-image-genx');
				effectImage.style.position = 'absolute';
				effectImage.style.top = '-630px';
				effectImage.style.right = 10 - Math.random() * (box.clientWidth - 100) + 'px';
				effectImage.style.width = '1920px';
				effectImage.style.height = '1080px';
				effectImage.style.objectFit = 'cover';
				effectImage.style.pointerEvents = 'none';
				effectImage.style.filter = 'drop-shadow(1px 1px 0 white) drop-shadow(1px -1px 0 white)';
				effectImage.style.maxWidth = 'unset';

				let idleAnimationTimeout;
				let currentIdleIndex = 0;

				function pickRandomIdleAnimation() {
					currentIdleIndex = Math.floor(Math.random() * 5) + 1;
					effectImage.src = imageCache[`/assets/clans/GENX-idle-${currentIdleIndex}.webp`];
					idleAnimationTimeout = setTimeout(pickRandomIdleAnimation, 4200);
				}

				let scrolling = false;

				function handleScroll() {
					if (currentIdleIndex !== 4 && currentIdleIndex !== 0 && !scrolling) {
						scrolling = true;
						const randomInIndex = Math.floor(Math.random() * 2) + 1;
						effectImage.src = imageCache[`/assets/clans/GENX-scroll-${randomInIndex}.webp`];
						clearTimeout(idleAnimationTimeout);

						setTimeout(
							() => {
								pickRandomIdleAnimation();
								scrolling = false;
							},
							randomInIndex == 1 ? 1000 : 1500
						);
					}
				}

				function handleBoxMouseMove(event) {
					const rect = effectImage.getBoundingClientRect();
					const centerX = rect.left + rect.width / 2;
					const centerY = rect.top + rect.height / 2;

					const distanceFromCenter = Math.sqrt(Math.pow(event.clientX - centerX, 2) + Math.pow(event.clientY - centerY, 2));

					if (distanceFromCenter < 130) {
						clearTimeout(idleAnimationTimeout);
						window.removeEventListener('scroll', handleScroll);
						effectImage.src = imageCache['/assets/clans/GENX-out-1.webp'];
						box.removeEventListener('mousemove', handleBoxMouseMove);

						setTimeout(() => {
							box.removeChild(effectImage);
						}, 4200);
					}
				}

				setTimeout(() => {
					pickRandomIdleAnimation();
					box.addEventListener('mousemove', handleBoxMouseMove);
					window.addEventListener('scroll', handleScroll);
				}, 5080);

				box.appendChild(effectImage);
			})
			.catch(error => {
				console.error('Failed to preload images:', error);
				box.showingEffect = false;
			});
	}
}
