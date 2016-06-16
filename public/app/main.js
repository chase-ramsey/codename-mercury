angular.module('app', ['ngRoute'])
  .config(() => {
    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyA3jd-g2KqgxMblPKSqQsIIhbT-c762-YE",
      authDomain: "codename-mercury.firebaseapp.com",
      databaseURL: "https://codename-mercury.firebaseio.com",
      storageBucket: "",
    };
    firebase.initializeApp(config);
  })
  .config(($routeProvider) => {
    $routeProvider
      .when('/', {
        templateUrl: 'app/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
  })
  .constant('BASE_API', 'https://codename-mercury.firebaseio.com/')
  .controller('MainCtrl', function($scope, FeedFactory) {
    const main = this;

    main.feeds = null;
    main.articles = null;

    FeedFactory.fetchFeedData()
      .then((result) => {
        return main.feeds = FeedFactory.getFeeds();
      })
      .then((feeds) => {
        return FeedFactory.fetchArticles(feeds);
      })
      .then((promiseArr) => {
        Promise.all(promiseArr)
          .then(() => {
            main.articles = FeedFactory.getArticles();
            $scope.$apply();
            console.log("main.articles: ", main.articles);
          })
      })
  })
  .factory('FeedFactory', function($http, ParseFactory, BASE_API) {

    let allFeeds = [];
    let processedArticles = [];

    return {

      fetchFeedData: function() {
        return $http.get(`${BASE_API}/feeds.json`)
            .then((res) => {
              allFeeds = res.data;
            })
      },

      fetchArticles: function(feeds) {
        let promiseArray = [];
        for (var key in feeds) {
          promiseArray.push(
            $http.get(feeds[key].url)
              .then((res) => {
                var parse = new DOMParser();
                var xml = parse.parseFromString(res.data, 'application/xml');
                var pubTitle = xml.querySelector('title').innerHTML;
                var parseResult = ParseFactory.docParse(xml);
                for (var i = 0; i < 10; i++) {
                  if (parseResult[i] === undefined) {
                    return;
                  } else {
                    processedArticles.push(parseResult[i]);
                  }
                }
                // console.log("processedArticles after parse: ", processedArticles);
                // processedArticles.push(ParseFactory.docParse(xml));
              })
            )
        }
        return promiseArray;
      },

      getFeeds: function() {
        return allFeeds;
      },

      getArticles: function() {
        return processedArticles;
      }

    }

  })
  .factory('ParseFactory', function(CreateService) {

    return {

      docParse: function(xml) {
        let returnObjects = [];
        let articles = [];
      // Get publication title
        const pubTitle = xml.querySelector('title').textContent;
      // Get articles by 'item' or 'entry'
        if (xml.getElementsByTagName('item').length !== 0) {
          articles = Array.from(xml.getElementsByTagName('item'));
        } else if (xml.getElementsByTagName('entry').length !== 0) {
          articles = Array.from(xml.getElementsByTagName('entry'));
        }
      // Loop over each item/entry to get values for every article
        articles.forEach(function(article) {
        // Get article title
          const title = article.querySelector('title').textContent;
        // Get article author
          const author = (() => {
            if (article.getElementsByTagName('author').length !== 0) {
              return article.getElementsByTagName('author')[0].textContent;
            } else if (article.getElementsByTagName('creator').length !== 0) {
              return article.getElementsByTagName('creator')[0].textContent;
            } else {
              return '';
            }
          })();
        // Get article link
          const link = (() => {
            if (article.querySelector('link') === null) {
              console.log('link null on ', xml,   article);
              return '';
            } else if (article.querySelector('link').textContent === '') {
              return article.querySelector('link').getAttribute('href');
            } else {
              return article.querySelector('link').textContent;
            }
          })();
        // Get article date published
          const date = (() => {
            if (article.querySelector('pubDate') !== null) {
              return new Date(article.querySelector('pubDate').innerHTML).toISOString();
            } else if (article.querySelector('published') !== null) {
              return new Date(article.querySelector('published').innerHTML).toISOString();
            } else {
              return '';
            }
          })();
        // Create new object with values and push them to the processedArticles array
          var articleObject = new CreateService.newArticle(title, author, link, date, pubTitle);
          // console.log('articleObject: ', articleObject);
          returnObjects.push(articleObject);
        })
        return returnObjects;
      }

    }
  })
  .service('CreateService', function() {
    this.newArticle = function (title, author, link, date, publ) {
      this.title = title;
      this.author = author;
      this.link = link;
      this.date = date;
      this.pubTitle = publ;
    }
  })
  .filter('dateFormat', () => {
    return (date) => {
      return moment(date).calendar();
    }
  })
