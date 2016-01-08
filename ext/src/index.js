(function (window) {
  'use strict';

  	// repictur definition
	function define_repictur_ext () {
	    var repictur_ext = {};

		Promise.any = function(arrayOfPromises) {
		  var resolvingPromises = arrayOfPromises.map(function(promise) {
		    return promise.then(function(result) {
		      return {
		        resolve: true,
		        result: result
		      };
		    }, function(error) {
		      return {
		        resolve: false,
		        result: error
		      };
		    });
		  });

		  return Promise.all(resolvingPromises).then(function(results) {
		    // Count how many passed/failed
		    var passed = [], failed = [], allFailed = true;
		    results.forEach(function(result) {
		      if(result.resolve) {
		        allFailed = false;
		      }
		      passed.push(result.resolve ? result.result : null);
		      failed.push(result.resolve ? null : result.result);
		    });

		    if(allFailed) {
		      throw failed;
		    } else {
		      return passed;
		    }
		  });
		};

		function getImageBlob(imgUrl, proxyUrl) {
			return fetch(imgUrl)
				.then(function(response) {
				  return response.blob();
				}, function (err) {
					return {
						err: err,
						url: imgUrl
					};
				});
		}

		function getImageDims(imgUrl, proxyUrl) {
			var defered = Promise.defer();
			var img = new Image();
			img.onload = function() {
			  defered.resolve({
			  	width: this.width,
			  	height: this.height
			  });
			};
			img.onerror = function (err) {
			  defered.reject(err);
			};
			img.src = imgUrl;
			return defered.promise;
		}

		function getImgs() {
			var defered = Promise.defer();
			defered.resolve([].slice.call(document.getElementsByTagName('img'), 0));
			return defered.promise;
		}
		
		function getImgType(imgUrl) {
			if (imgUrl.indexOf('.jpg') !== -1 || imgUrl.indexOf('.jpeg') !== -1) {
				return 'jpg'
			} else if (imgUrl.indexOf('.png')) {
				return 'png';
			}
		}

		function humanFileSize(bytes, si) {
		    var thresh = si ? 1000 : 1024;
		    if(Math.abs(bytes) < thresh) {
		        return bytes + ' B';
		    }
		    var units = si
		        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
		        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
		    var u = -1;
		    do {
		        bytes /= thresh;
		        ++u;
		    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
		    return bytes.toFixed(1)+' '+units[u];
		}

		function getProxyImg(imgUrl, width, height) {

	  		// Populate the builder with the wanted options, you must set at least image url and dimensions
		  	var builder = repictur.Builder.setImageUrl(imgUrl)
		  		.setExact(true)
		  		.setDimensions(width, height);	

	  		var imgType = getImgType(imgUrl);

	  		if (imgType === 'jpg') {
	  			builder.setJpegFormat(80);
	  		} else if (imgType === 'png') {
  				builder.setPngFormat();
	  		}

		    return builder.build();
		}

		function isValidImageUrl(imgUrl) {
			return imgUrl && getImgType(imgUrl) &&
						imgUrl.indexOf('google') === -1 &&
							imgUrl.indexOf('facebook') === -1 &&
								imgUrl.indexOf('twitter') === -1 &&
									imgUrl.indexOf('about:') === -1;

		}

		repictur_ext.getStats = function () {

			var defered = Promise.defer();

			var stats = [];
			var imagesStats;

			getImgs().then(function (imgs) {

				var imagesStats = imgs.filter(function (img) {
					return isValidImageUrl(img.src);
				}).map(function (img) {

					var imgItem = {
						img: img,
						url: img.src,
						display: {
							height: img.offsetHeight,
							width: img.offsetWidth
						}
					};

					var imgType = getImgType(img.src);

					if (
						imgItem.display.width > 0 && 
							imgItem.display.height > 0 && 
								(imgType === 'jpg' || imgType === 'png')
					) {
						imgItem.rePictureUrl = getProxyImg(img.src, imgItem.display.width, imgItem.display.height);
					} else {
						imgItem.rePictureUrl = imgItem.url;
					}
				 	
					imgItem.stats = [
						getImageDims(imgItem.url).then(function (dims) {
							imgItem.width = dims.width;
							imgItem.height = dims.height;
						}),
						getImageBlob(imgItem.url).then(function (blob) {
							imgItem.size = blob.size;
						}),
						getImageDims(imgItem.rePictureUrl).then(function (dims) {
							imgItem.proxy_width = dims.width;
							imgItem.proxy_height = dims.height;
						}),
						getImageBlob(imgItem.rePictureUrl).then(function (blob) {
							imgItem.proxy_size = blob.size;
						})
				 	];

					stats = stats.concat(imgItem.stats);

					return imgItem;
				});	

				return Promise.any(stats)
					.then(function () {
						defered.resolve(imagesStats);
					}, defered.reject);
			});
		
			return defered.promise;
		};

		repictur_ext.showStats = function (imagesStats) {

			var modal = document.createElement('div');
			modal.className = 'rePictuR-modal';

			var modalBody = document.createElement('div');
			modalBody.className = 'rePictuR-modal-body';
			modal.appendChild(modalBody);


			var modalClose = document.createElement('a');
			modalClose.className = 'rePictuR-modal-close';
			modalClose.innerText = "X";
			modalClose.addEventListener('click', function () {
				if (modal.parentNode) {
					modal.parentNode.removeChild(modal);	
				}
			});
			modalBody.appendChild(modalClose);

			var modalContent = document.createElement('div');
			modalContent.className = 'rePictuR-modal-content';
			modalBody.appendChild(modalContent);

			//

			var tableContent = document.createElement('table');
			tableContent.className = "rePictuR-table";
			modalContent.appendChild(tableContent);

			var tr = document.createElement('tr');
			tr.className = "rePictuR-header";
			tableContent.appendChild(tr);

			var th = document.createElement('th');
			th.innerText = 'Total';
			tr.appendChild(th);

			th = document.createElement('th');
			th.innerText = 'Before';
			tr.appendChild(th);

			th = document.createElement('th');
			th.innerText = 'After';
			tr.appendChild(th);

			var tr = document.createElement('tr');
			tr.className = "rePictuR-header";
			tableContent.appendChild(tr);

			var td = document.createElement('td');
			td.innerText = imagesStats.length;
			td.className = "rePictuR-td-ellipsis";
			tr.appendChild(td);

			td = document.createElement('td');
			td.innerText = humanFileSize(imagesStats.reduce(function (total, imagesStat) {
				return imagesStat.size + total;
			}, 0));
			
			tr.appendChild(td);

			td = document.createElement('td');
			td.innerText = humanFileSize(imagesStats.reduce(function (total, imagesStat) {
				return imagesStat.proxy_size + total;
			}, 0));

			tr.appendChild(td);

			// 			

			var tableContent = document.createElement('table');
			tableContent.className = "rePictuR-table";
			modalContent.appendChild(tableContent);

			var tr = document.createElement('tr');
			tr.className = "rePictuR-header";
			tableContent.appendChild(tr);

			var th = document.createElement('th');
			th.innerText = 'Source';
			tr.appendChild(th);

			th = document.createElement('th');
			th.innerText = 'Before';
			tr.appendChild(th);

			th = document.createElement('th');
			th.innerText = 'After';
			tr.appendChild(th);

			imagesStats.forEach(function (imagesStat) {

				var tr = document.createElement('tr');
				tableContent.appendChild(tr);

				var td = document.createElement('td');
				td.className = "rePictuR-td-ellipsis";
				td.innerText = imagesStat.url;
				tr.appendChild(td);

				td = document.createElement('td');
				tr.appendChild(td);

				var a = document.createElement('a');
				a.innerText = humanFileSize(imagesStat.size);
				a.href = imagesStat.url;
				a.target = "_blank";
				td.appendChild(a);

				td = document.createElement('td');
				tr.appendChild(td);

				a = document.createElement('a');
				a.innerText = humanFileSize(imagesStat.proxy_size);
				a.href = imagesStat.rePictureUrl;
				a.target = "_blank";
				td.appendChild(a);
			});

			document.body.appendChild(modal);
		};

		repictur_ext.replaceProxyImg = function (imagesStats) {
			imagesStats.forEach(function (imagesStat) {
				
				if (
					!imagesStat.img.parentNode.className ||
						imagesStat.img.parentNode.className.indexOf('rePictuR-tooltip') === -1
				) {
					imagesStat.img.parentNode.className += ' rePictuR-tooltip';
				}

				if (imagesStat.width != imagesStat.proxy_width || imagesStat.height != imagesStat.proxy_height) {
					var redim = 'Resized! - ';
				} else {
					var redim = '';
				}

				imagesStat.img.parentNode.title =  redim + 'Gain ' + humanFileSize((imagesStat.size - imagesStat.proxy_size));
				imagesStat.img.src = imagesStat.rePictureUrl;
			});
		};

		repictur_ext.addGetStatsBtn = function (imagesStats) {
			var btn = document.createElement('button');
			btn.innerText = "rePictuR";
			btn.className = 'rePictuR-btn';

			btn.addEventListener('click', function () {
				btn.disabled = true;
				btn.innerText = "rePictuR (...)";
				repictur_ext.getStats().then(function (imagesStats) {
					btn.disabled = false;
					btn.innerText = "rePictuR";
					repictur_ext.showStats(imagesStats);
					repictur_ext.replaceProxyImg(imagesStats);
				}, function (errs) {
					btn.disabled = false;
					btn.innerText = "rePictuR";
					console.error(errs, errs.stack);
				});
			});

			document.body.appendChild(btn);
		};

		return repictur_ext;
	};

	// Define globally if it doesn't already exist
    if (typeof repictur_ext === 'undefined') {
    	window.repictur_ext = define_repictur_ext();

		var applicationId = "780a28c3-801f-4d31-ba1a-a3029bebfeb1";
		repictur.initialize(applicationId, "gateway.repictur.com", false);

    	repictur_ext.addGetStatsBtn();
    } else {
      throw new Error('repictur_ext is already defined.');
    }
})(window);
