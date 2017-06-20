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

    // Sign-in button onClick
    $("#sign-in").click(function(){
        //Create an instance of the Google provider object
        var provider = new firebase.auth.GoogleAuthProvider();

        //sign in with a pop-up window
        firebase.auth().signInWithPopup(provider).then(function(result) {
            // Sign-in successful.
            $("main").show();
            $("#login").hide();
            $("#sign-out").css("display", "inline-block");
        }).catch(function(error) {
            // Handle Errors here.
            console.log(error.code);
            console.log(error.message);
        });
    });

    // Sign-out button onClick
    $("#sign-out").click(function(){
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            $("main").hide();
            $("#login").show();
            $("#sign-out").hide();
        }).catch(function(error) {
            // An error happened.
            console.log(error.code);
            console.log(error.message);
        });
    })


    // Get a reference to the firebase database service
    var dataBaseRef = firebase.database();
    

  	// Global selectors
  	var trainName = $("#trainName");
  	var destination = $("#destination");
  	var firstTime = $("#firstTime");
  	var frequency = $("#frequency");

  	// Function to validate inputs fields
  	function validate(){
  		var valid = true;
  		var timeFormat = /^([01]\d|2[0-3]):[0-5]\d$/; // example 01:30
  		var freqFormat = /^\d+$/;                     // only numbers

        //remove all messages
  		$(".text-danger").remove();

      //check if train name is empty
      if(trainName.val().trim() == ""){
  			trainName.after('<p class="text-danger">Train name is required.</p>');
  			valid = false;
  		}

      //check if destination is empty
  		if(destination.val().trim() == ""){
  			destination.after('<p class="text-danger">Train destination is required.</p>');
  			valid = false;
  		}

      //check if first time match timeFormat expression
  		if(!timeFormat.test(firstTime.val().trim())){
  			firstTime.after('<p class="text-danger">Invalid time format.</p>');
  			valid = false;
  		}

      //check if frequency is a number
  		if(!freqFormat.test(frequency.val().trim())){
  			frequency.after('<p class="text-danger">Invalid number.</p>');
  			valid = false;
  		}

      //retur true if everything is ok or false otherwise
  		return valid;
  	}

    // Function to clear form fields, display submit button and hide update button
    // This function is called after submit, update or delete
    function clearForm(){
        trainName.val("");
        destination.val("");
        firstTime.val("");
        frequency.val("");
        $("#submit").css("display", "inline-block");
        $("#update").css("display", "none").attr("data-trainId", "");
    }

  	// submit button click
  	$("#submit").click(function(event){
  		event.preventDefault();
  		
      // Only push to the database if the form is valid
  		if(validate()){
  			dataBaseRef.ref().push({
                trainName: trainName.val().trim(),
                destination: destination.val().trim(),
                firstTime: moment(firstTime.val().trim(),"HH:mm").format("X"),
                frequency: frequency.val().trim()
            });
            clearForm(); // Clear the form
  		}
  	});

    // Update button click
    $("#update").click(function(){ 
        // Only update the database if the form is valid
        if(validate()){
            var trainId = $(this).attr("data-trainId");

            dataBaseRef.ref(trainId).update({
                trainName: trainName.val().trim(),
                destination: destination.val().trim(),
                firstTime: moment(firstTime.val().trim(),"HH:mm").format("X"),
                frequency: frequency.val().trim()
            });
            
            clearForm(); // Clear the form
        }
    });

    // Delete button class onClick event. Those are the delete buttons inside the table
    // Each of those buttons has a unique data-trainId attr 
    $(document).on("click", ".delete", function(){
        var trainId = $(this).attr("data-trainId"); //get the train id from the clicked button

        //Pass this trainId to the delete button in the confirm dialog box
        $("#deleteTrain").attr("data-trainId", trainId);

        //Show the dialog box
        $("#confirm-delete").modal();
    });

    // Edit button class onClick event. Those are the edit buttons inside the table
    $(document).on("click", ".edit", function(){
        var trainId = $(this).attr('data-trainId'); //get the train id from the clicked button

        // Get record from the database matching the train id and then populate the form filds
        dataBaseRef.ref(trainId).once('value').then(function(childSnapshot) {
            trainName.val(childSnapshot.val().trainName);
            destination.val(childSnapshot.val().destination);
            firstTime.val(moment.unix(childSnapshot.val().firstTime).format('HH:mm'));
            frequency.val(childSnapshot.val().frequency);
        });

        //Hide submit button
        $("#submit").css("display", "none");
        // Display update button and pass the train id to its data-traindId attr
        $("#update").css("display", "inline-block").attr("data-trainId", trainId);
        // Send cursor to the train name imput
        trainName.focus();

    });

    // This is the delete button in the confirm dialog box
    $("#deleteTrain").on("click", function(){
        var trainId = $(this).attr("data-trainId"); //get the train id from its data attr
        dataBaseRef.ref(trainId).remove(); // Remove the record from the database
        clearForm(); // Clear the form
    });

    // Data base child added event.
    // This happens for every record in the database when the app load
    // and then once for every record added to the database
    dataBaseRef.ref().on('child_added', function(snapshot){
        var currTrain = snapshot.val();
        var nextArrival = '';
        var minAway = '';

        //create a moment object with the firstTime value in sec
        var firstTime = moment.unix(currTrain.firstTime);
    
        //difference between current time and first Time Arrival
        var diff = moment().diff(moment(firstTime, 'HH:mm'), 'minutes');
        //if difference between current time and first Time Arrival is >= 0
        if(diff >= 0) {
            var frequency = parseInt(currTrain.frequency);
            minAway = frequency - diff % frequency;
            nextArrival = moment().add(minAway, 'minutes').format('hh:mm A');
            var minAway = frequency - diff % frequency;
        } else {
            nextArrival = firstTime.format('hh:mm A');
            minAway = Math.abs(diff);

        }

        //create rows and cols
        var tr = $("<tr id=" + snapshot.key + ">");
        tr.append("<td>" + currTrain.trainName + "</td>");
        tr.append("<td>" + currTrain.destination + "</td>");
        tr.append("<td>" + currTrain.frequency + "</td>");
        tr.append("<td>" + nextArrival + "</td>");
        tr.append("<td>" + minAway + "</td>");
        tr.append('<td><button class="btn-danger btn delete" data-trainId="' + snapshot.key +
            '"data-toggle="modal"><i class="glyphicon glyphicon-remove"></i></button>' +
            '<button class="btn-info btn edit" data-trainId="' + snapshot.key +
            '"><i class="glyphicon glyphicon-pencil"></i></button></td>');
        $("tbody").append(tr);
    });

    // Data base child change event
    dataBaseRef.ref().on('child_changed', function(snapshot){
        var currTrain = snapshot.val();
        var nextArrival = '', minAway = '';

        //create a moment object with the firstTime value in sec
        var firstTime = moment.unix(currTrain.firstTime);
    
        //difference between current time and first Time Arrival
        var diff = moment().diff(moment(firstTime, 'HH:mm'), 'minutes');
        //if difference between current time and first Time Arrival is >= 0
        if(diff >= 0) {
            var frequency = parseInt(currTrain.frequency);
            minAway = frequency - diff % frequency;
            nextArrival = moment().add(minAway, 'minutes').format('hh:mm A');
            var minAway = frequency - diff % frequency;
        } else {
            nextArrival = firstTime.format('hh:mm A');
            minAway = Math.abs(diff);
        }

        //update row
        var tr = $("#" + snapshot.key);
        $(tr).children().eq(0).text(currTrain.trainName);
        $(tr).children().eq(1).text(currTrain.destination);
        $(tr).children().eq(2).text(currTrain.frequency);
        $(tr).children().eq(3).text(nextArrival);
        $(tr).children().eq(4).text(minAway);
    });

    // Data base child removed
    dataBaseRef.ref().on('child_removed', snap => {
        var key = snap.key;
        $("#" + key).remove();
    });

    
});