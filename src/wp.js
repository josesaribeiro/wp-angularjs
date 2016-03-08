/**
 * @module wp
 */
var wp = angular.module( "wp", [
	"wp.services",
	"ngResource",
	"ngSanitize"
] );

/**
 * @name <have-posts>
 *
 * @description
 *
 * The `havePosts` directive is a WordPress loop.
 *
 * **Attributes**
 *
 * | Attribute | Type   | Details                                                        |
 * |-----------|--------|----------------------------------------------------------------|
 * | api-root  | string | Root url of the API. e.g. http://example.com/wp-json/wp/v2     |
 * | post-type | string | `posts` or `pages` or `media` or custom post type.             |
 * | per-page  | number | The number of posts per page. Default is 10.                   |
 * | offset    | number | The number of post to displace or pass over. Default is 0.     |
 *
 * @example
 *
 * ```html
 * <have-posts api-root="http://example.com" post-type="posts">
 *   <h2 class="entry-title"><the-title></the-title></h2>
 *   <div class="entry-content"><the-content></the-content></div>
 * </have-posts>
 * ```
 */
wp.directive( "havePosts", [ "wpQuery", function( wpQuery ) {
	return {
		restrict: "E",
		replace: true,
		transclude: true,
		scope: {
			postType: '@',
			postId: '@',
			apiRoot: '@',
			perPage: '@',
			offset: '@'
		},
		controller: [ "$scope", function( $scope ) {
			$scope.load = function() {
				if ( true == $scope.busy ) {
					return;
				}
				$scope.busy = true;
				wpQuery( $scope.apiRoot ).query( $scope.query ).$promise
							.then( function( posts ) {
					if ( posts.length ) {
						$scope.posts = $scope.posts.concat( posts );
						$scope.busy = false;
						$scope.query.offset = parseInt( $scope.query.offset )
								+ parseInt( $scope.perPage);
					}
				} );
			}
		} ],
		compile: function( tElement, tAttrs, transclude ) {
			return {
				pre: function preLink( scope, element, attrs, controller ) {
					scope.posts = [];
					if ( scope.postId ) {
						scope.query = {
							'endpoint': scope.postType,
							'id': scope.postId
						}
						wpQuery( scope.apiRoot ).get( scope.query ).$promise
								.then( function( posts ) {
							scope.posts.push( posts );
						} );
					} else {
						if ( ! scope.perPage ) {
							scope.perPage = 10;
						}
						if ( ! scope.offset ) {
							scope.offset = 0;
						}
						scope.query = {
							'endpoint': scope.postType,
							'per_page': scope.perPage,
							'offset': scope.offset,
							'filter[orderby]': 'date',
							'filter[order]': 'DESC',
							'_embed': true
						}
						scope.load();
					}
				}
			}
		},
		template: "<div class=\"have-posts\">"
					+ "<div infinite-scroll=\"load()\""
								+ " infinite-scroll-distance=\"2\">"
					+ "<article class=\"{{ postType }}"
						+ " post-{{ post.id }}\" ng-repeat=\"post in posts\">"
							+ "<div ng-transclude></div></article>"
								+ "</div></div>"
	}
} ] );


/**
 * @name <the-title>
 *
 * @description
 *
 * Displays the post title of the current post.
 *
 * **Attributes**
 *
 * | Attribute | Type   | Details                                                        |
 * |-----------|--------|----------------------------------------------------------------|
 * | href      | string | Specify a link URL like `#/app/posts/:id`.                     |
 *
 * @example
 *
 * ```html
 * <the-title></the-title>
 * ```
 * Then:
 * ```html
 * <div class="the-title">Hello World</div>
 * ```
 *
 * If you need a link to the post on your app. Please add `href` as attribute.
 *
 * ```html
 * <the-title href="#/posts/:id"></the-title>
 * ```
 * `:id` is a placeholder of the post's id. You can use `:slug` as post's slug too.
 *
 * Then:
 * ```html
 * <div class="the-title"><a href="#/posts/:id">Hello World</a></div>
 * ```
 */
wp.directive( "theTitle", [ "$sce", function( $sce ) {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		transclude: true,
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					var post = scope.$parent.post;
					scope.title = post.title.rendered;
					if ( tAttrs.href ) {
						scope.permalink = tAttrs.href;
						scope.permalink = scope.permalink.replace( ':id', post.id );
						scope.permalink = scope.permalink.replace( ':slug', post.slug );
					} else {
						scope.permalink = '';
					}
					element.remove( 'href' );
				}
			}
		},
		template: function( tElement, tAttrs ) {
			if ( tAttrs.href ) {
				return "<div class=\"the-title\">"
						+ "<a ng-href=\"{{ permalink }}\" ng-bind-html=\"title\">"
							+ "{{ title }}</a></div>";
			} else {
				return "<div class=\"the-title\" ng-bind-html=\"title\">"
						+ "{{ title }}</div>";
			}
		}
	}
} ] );


/**
 * @name <the-content>
 *
 * @description
 * Displays the post content of the current post.
 *
 * @example
 *
 * ```html
 * <the-content></the-content>
 * ```
 * Then:
 * ```html
 * <div class="the-content"><p>Hello World</p></div>
 * ```
 */
wp.directive( "theContent", [ "$sce", function( $sce ) {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					var post = scope.$parent.post;
					scope.content = $sce.trustAsHtml( post.content.rendered );
				}
			}
		},
		template: "<div class=\"the-content\" ng-bind-html=\"content\">"
						+ "{{ content }}</div>"
	}
} ] );


/**
 * @name <the-post-thumbnail>
 *
 * @description
 * Displays the post thumbnail of the current post.
 *
 * **Attributes**
 *
 * | Attribute | Type   | Details                                                        |
 * |-----------|--------|----------------------------------------------------------------|
 * | size      | string | Size of the post thumbnail. Default is `full`.                 |
 *
 * @example
 *
 * ```html
 * <the-post-thumbnail></the-post-thumbnail>
 * ```
 * Then:
 * ```
 * <div class="the-post-thumbnail"><img src="http://example.com/image.jpg"></div>
 * ```
 *
 * Uses `size` attribute.
 * ```html
 * <the-post-thumbnail size="full"></the-post-thumbnail>
 * ```
 * Then:
 * ```
 * <div class="the-post-thumbnail"><img src="http://example.com/image.jpg"></div>
 * ```
 */
wp.directive( "thePostThumbnail", [ function() {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					if ( ! attrs.size ) {
						attrs.size = 'post-thumbnail';
					}
					var scheme = 'https://api.w.org/featuredmedia';
					var _embedded = scope.$parent.post._embedded;
					var img;
					if ( _embedded && _embedded[scheme] && _embedded[scheme].length ) {
						if ( _embedded[scheme][0].media_details.sizes[attrs.size] ) {
							img = _embedded[scheme][0].media_details
									.sizes[attrs.size].source_url;
						} else {
							img = _embedded[scheme][0].media_details
									.sizes['full'].source_url;
						}
					}
					if ( img ) {
						scope.image_src = img;
					}
				}
			}
		},
		template: "<div class=\"the-post-thumbnail\">"
						+ "<img ng-src=\"{{ image_src }}\"></div>"
	}
} ] );


/**
 * @name <the-id>
 *
 * @description
 *
 * Displays the ID of the current post.
 *
 * @example
 *
 * ```
 * <the-id></the-id>
 * ```
 * Then:
 * ```
 * <div class="the-id">123</div>
 * ```
 */
wp.directive( "theId", [ function() {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					scope.post_id = scope.$parent.post.id;
				}
			}
		},
		template: "<div class=\"the-id\">{{ post_id }}</div>"
	}
} ] );


/**
 * @name <the-excerpt>
 *
 * @description
 *
 * Displays the excerpt of the current post.
 *
 * @example
 *
 * Place the code like following into your HTML.
 * ```
 * <the-excerpt></the-excerpt>
 * ```
 * Then you will get like following.
 * ```
 * <div class="the-excerpt"><p>Hello World.</p></div>
 * ```
 */
wp.directive( "theExcerpt", [ '$sce', function( $sce ) {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					var post = scope.$parent.post;
					scope.excerpt = $sce.trustAsHtml( post.excerpt.rendered );
				}
			}
		},
		template: "<div class=\"the-excerpt\" ng-bind-html=\"excerpt\">"
						+ "{{ excerpt }}</div>"
	}
} ] );


/**
 * @name <the-date>
 *
 * @description
 *
 * Displays the date of the current post.
 *
 * **Attributes**
 *
 * | Attribute | Type   | Details                                                        |
 * |-----------|--------|----------------------------------------------------------------|
 * | format    | string | See https://docs.angularjs.org/api/ng/filter/date              |
 *
 * @example
 *
 * Place the code like following into your HTML.
 * ```
 * <the-date></the-date>
 * ```
 * Then you will get like following.
 * ```
 * <div class="the-date">2016-02-16 13:54:13</div>
 * ```
 *
 * You can set format string like following.
 * See https://docs.angularjs.org/api/ng/filter/date.
 * ```
 * <the-date  format="yyyy/MM/dd"></the-date>
 * ```
 * Then you will get like following.
 * ```
 * <div class="the-date">2016-02-16</div>
 * ```
 */
wp.directive( "theDate", [ function() {
	return{
		restrict:'E',
		replace: true,
		require : '^havePosts',
		compile: function( tElement, tAttrs, transclude ) {
			return {
				post: function postLink( scope, element, attrs, controller ) {
					if ( ! attrs.format ) {
						scope.format = "yyyy/MM/ddTH:mm:ssZ";
					} else {
						scope.format = attrs.format;
					}
					var date = scope.$parent.post.date_gmt + "Z";
					scope.date = date;
				}
			}
		},
		template: "<div class=\"the-date\">{{ date | date: format }}</div>"
	}
} ] );
