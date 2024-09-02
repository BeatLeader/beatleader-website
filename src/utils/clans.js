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

export function addRandomImageOnHover(playerPage) {
	const observer = new MutationObserver(() => {
		const contentBoxes = playerPage.querySelectorAll('.content-box:not(.profile-box)');
		contentBoxes.forEach(box => {
			box.removeEventListener('mouseenter', handleMouseEnter);
			box.removeEventListener('touchstart', handleTouchStart);
			box.addEventListener('mouseenter', handleMouseEnter);
			box.addEventListener('touchstart', handleTouchStart);
		});
	});

	observer.observe(playerPage, {childList: true, subtree: true});

	function handleMouseEnter(event) {
		showImage(event.currentTarget, false);
	}

	function handleTouchStart(event) {
		showImage(event.currentTarget, true);
	}

	function showImage(box, isTouch) {
		const parentBox = box.parentElement;
		const fakeBox = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		fakeBox.setAttribute('width', box.clientWidth);
		fakeBox.setAttribute('height', box.clientHeight);
		fakeBox.style.position = 'absolute';
		fakeBox.style.top = `${box.offsetTop}px`;
		fakeBox.style.left = `${box.offsetLeft}px`;
		if (!isTouch) {
			fakeBox.style.zIndex = '-1';
		}
		fakeBox.style.pointerEvents = 'none';
		fakeBox.style.overflow = 'visible';

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

		img.setAttribute('transform', `rotate(${angle} ${x + size / 2} ${y + size / 2}) translate(0 ${size})`);
		img.style.transition = 'transform 0.3s ease';

		requestAnimationFrame(() => {
			img.setAttribute('transform', `rotate(${angle} ${x + size / 2} ${y + size / 2}) translate(0 0)`);
		});

		g.appendChild(img);
		fakeBox.appendChild(g);
		parentBox.appendChild(fakeBox);

		const removeImage = () => {
			img.setAttribute('transform', `rotate(${angle} ${x + size / 2} ${y + size / 2}) translate(0 ${size})`);
			img.addEventListener(
				'transitionend',
				() => {
					parentBox.removeChild(fakeBox);
				},
				{once: true}
			);
		};

		if (isTouch) {
			setTimeout(removeImage, 1400);
		} else {
			box.addEventListener('mouseleave', removeImage, {once: true});
		}
	}
}
