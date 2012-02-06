(function($) {
	
	window.LibraryItem = Backbone.Model.extend({
		
		getViewBookUrl: function(book) {
			return "/views/viewer.html?book=" + this.get('key');
		},

		openInReader: function() {
			window.location = this.getViewBookUrl();
		},

		delete: function() {
			var key = this.get('key');
			Lawnchair(function() {
				var that = this; // <=== capture Lawnchair scope
				this.get(key, function(book) {
					if(book) {
						Readium.FileSystemApi(function(fs) {
							fs.rmdir(book.key);
							that.remove(key);
						});
					}
				});		
			});
		}
	});

	window.LibraryItems = Backbone.Collection.extend({

		model: LibraryItem
		
	});

	window.LibraryItemView = Backbone.View.extend({

		tagName: 'div',

		className: "book-item clearfix",

		initialize: function() {
			_.bindAll(this, "render");
			this.template = _.template( $('#library-item-template').html() );	
		},

		render: function() {
			var renderedContent = this.template(this.model.toJSON());
			$(this.el).html(renderedContent);
			return this;
		},

		events: {
			"click .delete": function(e) {
				e.preventDefault();
				var confMessage;
				confMessage  = "Are you sure you want to perminantly delete " 
				confMessage += this.model.get('title');
				confMessage += "?"

				if(confirm(confMessage)) {
					this.model.delete();
					this.remove();
				}
			},

			"click .read": function(e) {
				this.model.openInReader();
			}
			
		}
	});

	window.LibraryItemsView = Backbone.View.extend({
		tagName: 'div',

		id: "library-items-container",

		className: 'row-view clearfix',

		initialize: function() {
			_.bindAll(this, "render");
			this.template = _.template( $('#library-items-template').html() );
			this.collection.bind('reset', this.render)
		},

		render: function() {
			var collection = this.collection;
			var $container = $(this.el);
			$container.html(this.template({}));

			// it the collection is empty break out early
			if(collection.length === 0 ) {
				$container.append("<p>Your book list is empty</p>");
				return this;
			}

			collection.each(function(item) {
				var view = new LibraryItemView({
					model: item,
					collection: collection,
					id: item.get('id')
				});
				$container.append( view.render().el );

			});
			
			// i dunno if this should go here
			$('#library-books-list').html(this.el)
			return this;
		},

		events: {
			
		}
	});

	
	var addLibraryBooks =  function(records) {
		var html;
		if(records.length === 0) {
			html = "<p>Your book list is empty</p>";
		}
		else {
			html = ""
			for(var i = 0; i < records.length; i++) {
				html += getBookHtml(records[i]);
			}
			
		}
		$('#library-items-container').html(html);
		$('.delete-link').click(function(e) {
			var key;
			var $this = $(this);
			var confirmed = confirm( $(this).attr("data-confirm") );
			e.preventDefault();
			if( confirmed ) {
				key = $(this).attr("data-key");
				deleteBook(key);		
			} 
			
		});
		$('#loading-message').remove();
	};
		
	

	window.Library = new LibraryItems();



	

})(jQuery);

var handleFileSelect = function(evt) {
	var files = evt.target.files; // FileList object
	var url = window.webkitURL.createObjectURL(files[0]);
	
    // Create a new window to the info page.
    chrome.windows.create({ url: ('/views/extractBook.html#' + url), width: 1200, height: 760 });
};

var clickHandler = function(evt) {
	var input = document.getElementById('book-url');
	if(input.value === null || input.value.length < 1) {
		alert("invalid url, cannot process");
	}
	else {
		var url = input.value;
		chrome.windows.create({ url: ('/views/extractBook.html#' + url), width: 1200, height: 760 });
	}
};

var flash = function(text, type) {
	var className = "alert";
	if(type) {
		className += " alert-" + type;
	}
	$('#flash-container').
		html('<div>'+text+'</div>').
		removeClass().
		addClass(className);
	
}

$(function() {
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
	document.getElementById('url-button').addEventListener('click', clickHandler, false);
	_lawnchair = new Lawnchair(function() {
		this.all(function(all) {
			window.Library.reset(all);	
			var lib = new LibraryItemsView({collection: window.Library});			
			lib.render();
		});
	});
	$("#block-view-btn").click(function(e) {
		$('#library-items-container').addClass("block-view").removeClass("row-view")
	});
	$("#row-view-btn").click(function(e) {
		$('#library-items-container').addClass("row-view").removeClass("block-view")
	})
	
});


