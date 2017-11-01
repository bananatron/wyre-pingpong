var airtableApiKey = "keyhdUvEUU5IL7Aqs";
var airtableMatchUrl = "https://api.airtable.com/v0/appAbzOBI0MLX1xzn/Matches";

new Vue({
  el: '#standings',

  data: {
    standing: {
      show: false,
      players: {}
    },
    matches: {},
    history: {
      loading: false,
      show: false,
      player: null,
      matches: []
    }
  },

  created: function () {
    this.getMatchesFromAirtable(this);
  },

  methods: {
    getMatchesFromAirtable: function(component) {
      var _this = this;
      var component = component;

      $.ajax({
          url: "https://api.airtable.com/v0/appAbzOBI0MLX1xzn/Players?view=Grid%20view",
          headers: {"Authorization": "Bearer " + airtableApiKey}
      }).done(function(data) {
          console.log('Got matches from airtable...');

          data.records.forEach(function(player) {
            if (player.fields['Matches Count'] < 1) return;
            component.standing.players[player.id] = player.fields;
          })
          component.standing.show = true;

      }).fail(function(data) {
          alert('‼️ Failure connecting to airtable for player data!');
          console.log('‼️ Failure connecting to airtable for player data!', data);
      })
    },

    showMatchHistory: function(player_id) {
      var _this = this;
      var playerMatches = _this.standing.players[player_id]['Matches'];

      _this.resetMatchHistory();
      _this.history.player = player_id;

      console.log('Getting match data for player_id ', player_id)

      if (Object.keys(_this.matches).length == 0) {
        
        _this.fetchMatches(airtableMatchUrl, function() { // Fetch fresh

          playerMatches.forEach(function(match_id) { //Filter player matches
            if (_this.matches[match_id]) { // If match exists
              _this.history.matches.push(_this.matches[match_id])
            }
          })
          _this.history.loading = false;
          _this.history.show = true;
        })
      } else { // Use cached data
        console.log('Using cached match data');
        playerMatches.forEach(function(match_id) { //Filter player matches
          _this.history.matches.push(_this.matches[match_id])
        })
        _this.history.show = true;
      }
    },

    fetchMatches: function(url, callback) {
      _this = this;
      _this.history.loading = true;
      console.log('Fetching match data from airtable');

      $.ajax({
        url: url,
        headers: {"Authorization": "Bearer " + airtableApiKey}
      }).done(function(data) {

        data.records.forEach(function(matchRecord) {
          _this.matches[matchRecord.id] = matchRecord.fields

          // Reformat participant names
          _this.matches[matchRecord.id]['Participants'].map(function(player_id, index) {
            _this.matches[matchRecord.id]['Participants'][index] = _this.standing.players[player_id]['Name']
            return _this.standing.players[player_id]['Name']
          })

          // Reformat winner names
          _this.matches[matchRecord.id]['Winner'].map(function(player_id, index) {
            _this.matches[matchRecord.id]['Winner'][index] = _this.standing.players[player_id]['Name']
            return _this.standing.players[player_id]['Name']
          })

        })

        // If we have an offset, we only got a single page of results, we need to get
        // the rest by passing in an offset param
        if (data.offset) {
          console.log('Getting another page from airtable', data.offset);
          callback = callback || null
          _this.fetchMatches(airtableMatchUrl + "?offset=" + data.offset, callback);
        } else {
          if (callback) setTimeout(callback(), 400)
        }

      }).fail(function(data) {
          alert('‼️ Failure connecting to airtable for match data!');
          console.log('‼️ Failure connecting to airtable for match data!', data);
      })
    },

    resetMatchHistory: function() {
      this.history.player = null;
      this.history.matches = [];
    },
    closeMatchHistory: function() {
      this.resetMatchHistory();
      this.history.show = false
    }

  }
})


$("#add-entry").on("click", function(){
  $("#airtable-form").show();
})

$("#back-form").on('click', function() {
  $("#airtable-form").hide();
})