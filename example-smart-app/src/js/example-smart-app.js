(function(window){
  'use strict';
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        alert("test2");

        var header = null;
        if (smart.server.auth.type === 'bearer') {
            header = 'Bearer ' + smart.server.auth.token;
         }
        var patientId = null;
        if (smart.tokenResponse) {
             patientId = smart.tokenResponse.patient;
             var encounterId = smart.tokenResponse.encounter;
             var userId = smart.tokenResponse.user;
        }

        var patient = smart.patient;
        var pt = patient.read();
        $.when(pt).fail(onError);

        $.when(pt).done(function(patient) {
          var personId = 12724065;
          var url = "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/" + personId + "/$health-cards-issue";

          var request = new XMLHttpRequest();
          request.open("POST", url, true);
          request.onreadystatechange = function() {
            if (request.readyState === 4) {

              if (request.DONE && request.status === 200) {
                alert(request.response);
                var testData = JSON.parse(request.response);
                var qrcode = new QRCode(document.getElementById("qrcode"), {
                   text: testData.parameter[0].valueString,
                   width: 128,
                   height: 128,
                   colorDark : "#000000",
                   colorLight : "#ffffff",
                   correctLevel : QRCode.CorrectLevel.H
                 });

                 var fname = '';
					       var lname = '';
                 if (typeof patient.name[0] !== 'undefined') {
        						fname = patient.name[0].given.join(' ');
        						lname = patient.name[0].family.join(' ');
        				 }

                 var p = defaultPatient();
                 p.birthdate = patient.birthDate;
                 p.fname = fname;
					       p.lname = lname;
                 p.immun = 'immun';
                 ret.resolve(p);
              }
              else {
                 alert("faliure");
              }
            }
          }
          request.setRequestHeader("Accept", "application/fhir+json");
          request.setRequestHeader("Content-Type", "application/fhir+json");
          var body = "{\"resourceType\":\"Parameters\","
                     + "\"parameter\":["
                     +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#immunization\"},"
                     +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#covid19\"}]}";

          request.send(body);

        });
      }
      else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
};

function getImmunizationInformation(jwsToken)
{
  var url = "https://fhir-open.stagingcerner.com/beta/admin/health-cards/decode";
  var request = new XMLHttpRequest();
  request.open("POST", url, true);
  request.onreadystatechange = function() {
  }
  var body = "{\"jws\":"
            + jwsToken + ","
            + "\"verify_signature\":"
            + true
            + "}";
  request.send(body);
  if (request.readyState === 4) {
    
  }
}

 function defaultPatient(){
    return {
      fname: { value: '' },
			lname: { value: '' },
			birthdate: { value: '' },
      immun: {value: ''},
    };
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#birthdate').html(p.birthdate);
		$('#fname').html(p.fname);
		$('#lname').html(p.lname);
    //$('#immun').html(p.immun);
  };

})(window);
