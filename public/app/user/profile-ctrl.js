angular.module('app')
  .controller('ProfileCtrl', function($scope, $location, $route, AuthFactory, UserFactory, FeedFactory, UserFeedService) {
    const profile = this;

    profile.user = AuthFactory.getLoggedUser();
    profile.allFeeds = FeedFactory.getFeeds();
    profile.addFeeds = false;

    profile.current = {};
    profile.currentKey = null,
    profile.articles = null;
    profile.userTopics = [];
    profile.addFeedsFiltered = {};

    profile.newFeeds = {};
    profile.userFeeds = {};
    profile.addNewFeed = {};

    profile.toDelete = [];

    profile.loading = true;
    profile.filtering = false;

    profile.userSearch = '';
    profile.userFilterTopic = '';
    profile.userFilterFeed = '';

    profile.addNewSpotlight = false;
    profile.spotlight = false;
    profile.spotlightItem = {};

    UserFactory.fetchProfiles()
      .then((res) => {
        UserFactory.setAllProfiles(res.data);
        for (var key in res.data) {
          if (profile.user === null) {
            $location.path('/');
          } else if (res.data[key].uid === profile.user.uid) {
              profile.current[key] = res.data[key];
              profile.currentKey = Object.keys(profile.current)[0];
              profile.checkUserProfiles(profile.current, profile.currentKey);
              profile.filterAddFeeds();
          }
        }
      })

    profile.checkUserProfiles = (current, key) => {
      if (!current[key].feeds) {
        profile.loading = false;
        profile.noFeeds = true;
      } else {
          for (var item in current[key].feeds) {
            if (profile.userTopics.indexOf(current[key].feeds[item].topic) === -1) {
              profile.userTopics.push(current[key].feeds[item].topic)
            }
          }
        profile.loadArticles();
      }
    }

    profile.filterAddFeeds = () => {
      Object.assign(profile.addFeedsFiltered, profile.allFeeds);
      for (var allFeedKey in profile.allFeeds) {
        for (var userFeedKey in profile.current[profile.currentKey].feeds) {
          if (profile.allFeeds[allFeedKey].url === profile.current[profile.currentKey].feeds[userFeedKey].url) {
            delete profile.addFeedsFiltered[allFeedKey];
          }
        }
      }
    }

    profile.loadArticles = () => {
      if (profile.noFeeds) {
        return;
      }
      var promises = FeedFactory.fetchArticles(profile.current[profile.currentKey].feeds);
      Promise.all(promises)
        .then(() => {
          profile.articles = FeedFactory.getArticles();
          profile.loading = false;
          profile.noFeeds = false;
          $scope.$apply();
        })
    }

    profile.topicColors = {
      'news': 'bg-blue',
      'politics': 'bg-red',
      'videogames': 'bg-green',
      'music': 'bg-purple',
      'movies': 'bg-orange',
      'culture': 'bg-yellow',
      'tech': 'bg-navy'
    }

    profile.setTopicColor = (topic) => {
      for (var key in profile.topicColors) {
        if (key === topic) {
          return profile.topicColors[key];
        }
      }
    }

    profile.setTopicFilter = (topic) => {
      if (profile.noFeeds) {
        return;
      }
      profile.userFilterFeed = '';
      profile.userFilterTopic = topic;
      profile.filtering = false;
    }

    profile.setFeedFilter = (article) => {
      profile.userFilterFeed = article.pubTitle;
    }

    profile.clearFilters = () => {
      profile.userSearch = '';
      profile.userFilterTopic = '';
      profile.userFilterFeed = '';
    }

    profile.setSpotlight = (bool, item) => {
      profile.spotlight = bool;
      profile.spotlightItem = item;
    }

    profile.toggleAddFeed = (feed) => {
      if (profile.newFeeds[feed.key]) {
        delete profile.newFeeds[feed.key];
      } else {
        profile.newFeeds[feed.key] = feed;
      }
    }

    profile.subscribe = (feeds, key) => {
      let promises = UserFactory.postNewFeeds(feeds, key);
      Promise.all(promises)
            .then(() => {
              $route.reload();
            })
            .catch(console.log);
    }

    profile.checkTopics = (topic) => {
      for (var i = 0; i < profile.userTopics.length; i++) {
        if (profile.userTopics[i] === topic) {
          return true;
        }
      }
    }

    profile.submitAddNew = () => {
      profile.addNewFeed.key = profile.addNewFeed.name.toLowerCase();
      profile.addNewFeed.key = profile.addNewFeed.key.split(' ').join('_');
      let userFeed = new UserFeedService.userFeed(profile.addNewFeed.key, profile.addNewFeed.name, profile.addNewFeed.link, profile.addNewFeed.topic);
      profile.newFeeds[profile.addNewFeed.key] = userFeed;
      profile.userFeeds[profile.addNewFeed.key] = userFeed;
      profile.closeAddSpotlight();
    }

    profile.closeAddSpotlight = () => {
      profile.addNewSpotlight = false;
      profile.addNewFeed = {};
    }

    profile.backToNews = () => {
      if (profile.addFeeds) {
        profile.addFeeds = false;
      } else if (profile.deleteFeeds) {
        profile.deleteFeeds = false;
      }
    }

    profile.toDeleteToggle = (feed) => {
      let index = profile.toDelete.indexOf(feed.$key);
      if (index === -1) {
        profile.toDelete.push(feed.$key);
      } else {
        profile.toDelete.splice(index, 1);
      }
    }

    profile.unsubscribe = () => {
      var promises = UserFactory.userDeleteFeeds(profile.toDelete, profile.currentKey);
      Promise.all(promises)
        .then(() => {
          $route.reload();
        });
    }

  })