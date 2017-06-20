$(document).ready(function(){
	// Initialize Firebase
	var config = {
    	apiKey: "AIzaSyC5dWsV-fEWvpDyXGQsM5SeeLeKmoeDaj8",
    	authDomain: "train-scheduler-b6366.firebaseapp.com",
    	databaseURL: "https://train-scheduler-b6366.firebaseio.com",
    	projectId: "train-scheduler-b6366",
    	storageBucket: "train-scheduler-b6366.appspot.com",
    	messagingSenderId: "82721035089"
  	};
  	firebase.initializeApp(config);

    // Global variables
    var dataBaseRef = firebase.database();
    
  	// selectors
  	var trainName = $("#trainName");
  	var destination = $("#destination");
  	var firstTime = $("#firstTime");
  	var frequency = $("#frequency");
  	var notifications = $("#notifications");

  	// Function to validate inputs fields
  	function validate(){
  		var valid = true;
  		var timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/;
  		var freqFormat = /^\d+$/;

  		$(".text-danger").remove();

  		if(trainName.val() == ""){
  			trainName.after('<p class="text-danger">Train name is required.</p>');
  			valid = false;
  		}

  		if(destination.val() == ""){
  			destination.after('<p class="text-danger">Train destination is required.</p>');
  			valid = false;
  		}

  		if(!timeFormat.test(firstTime.val().trim())){
  			firstTime.after('<p class="text-danger">Invalid Time format.</p>');
  			valid = false;
  		}

  		if(!freqFormat.test(frequency.val().trim())){
  			frequency.after('<p class="text-danger">Invalid frequency format.</p>');
  			valid = false;
  		}
  		return valid;
  	}


  	// submit button click
  	$(":submit").click(function(event){
  		event.preventDefault();
  		
  		if(validate()){
  			dataBaseRef.ref().push({
                trainName: trainName.val().trim(),
                destination: destination.val().trim(),
                firstTime: moment(firstTime.val().trim(),"HH:mm").format("X"),
                frequency: frequency.val().trim()
            });

            trainName.val("");
            destination.val("");
            firstTime.val("");
            frequency.val("");
  		}
  	});

    dataBaseRef.ref().on('child_added', function(snapshot){
        var currTrain = snapshot.val();
        var nextArrival = '', minAway = '';

        //create a moment object with the firstTime value in sec
        var firstTime = moment.unix(currTrain.firstTime);
    
        //difference between current time and first Time Arrival
        var diff = moment().diff(moment(firstTime, 'HH:mm'), 'minutes');
         console.log(diff);
        //if difference between current time and first Time Arrival is >= 0
        if(diff >= 0) {
            var frequency = parseInt(currTrain.frequency);
            minAway = frequency - diff % frequency;
            nextArrival = moment().add(minAway, 'minutes').format('hh:mm A');
            var minAway = frequency - diff % frequency;
        } else {
            nextArrival = firstTime.format('hh:mm A');
            minAway = Math.abs(diff - 1);

        }
        var tr = $("<tr id=" + snapshot.key + ">");
        tr.append("<td>" + currTrain.trainName + "</td>");
        tr.append("<td>" + currTrain.destination + "</td>");
        tr.append("<td>" + currTrain.frequency + "</td>");
        tr.append("<td>" + nextArrival + "</td>");
        tr.append("<td>" + minAway + "</td>");
        tr.append('<td><button class="btn-danger btn delete" data-trainId="' + snapshot.key +
            '"data-toggle="modal"><i class="glyphicon glyphicon-remove"></i></button></td>');
        $("tbody").append(tr);
    });

    dataBaseRef.ref().on('child_removed', snap => {
        var key = snap.key;
        $("#" + key).remove();
    })

    // Delete button class
    $(document).on("click", ".delete", function(){
        var trainId = $(this).attr("data-trainId");
        $("#deleteTrain").attr("data-trainId", trainId);
        $("#confirm-delete").modal();
    })

    $("#deleteTrain").on("click", function(){
        var trainId = $(this).attr("data-trainId");
        dataBaseRef.ref(trainId).remove();
    })
});