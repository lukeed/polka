(function () {
	let i=0, img, arr=[];
	let doc=document, app=doc.getElementById('app'), images=[
		'uOi3lg8fGl4', 'OjVIrvBKWP8', 'uSFOwYo1qEw',  'tZaA8VqJG3g',
		'9yWcy5B-haM', '_MeRaXKnEYo', 'HrkyU8bVwYI', 'Yohivf5JWvg',
		'78A265wPiO4', 'TAhsXhWipwg', 'dQBZY7yEVpc', '6k2FqycNmwU'
	];

	for (; i < images.length; i++) {
		img = doc.createElement('img');
		img.src = 'https://source.unsplash.com/' + images[i];
		arr.push(img) && app.appendChild(img);
	}

	onloaded(arr, {
		onComplete() {
			app.className = 'rdy';
		}
	});
})();
