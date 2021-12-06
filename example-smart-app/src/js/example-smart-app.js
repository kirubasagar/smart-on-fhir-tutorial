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
        alert("test1");
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

       var testData1 = getSmartCard(patientId);

       var p = defaultPatient();
       p.immun = 'immun';

       ret.resolve(p);
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function getSmartCard(patientId){
    try
    {
        var personId = 12724065;
        var url = "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/" + personId + "/$health-cards-issue";
        var request = new XMLHttpRequest();
        request.open("POST", url, true);
        request.onreadystatechange = function() {
          if (request.readyState === 4) {

            if (request.DONE && request.status === 200) {
              alert(request.response);
              var testData = JSON.parse(request.response);
              // alert("ResourceType: " + testData.resourceType);
              // alert("ValueString: " + testData.parameter[0].valueString);
              //return testData;
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
      }
      catch (err) {
        alert(err);
      }
  }

  function defaultPatient(){
    return {
      immun: {value: ''},
    };
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#immun').html(p.immun);
  };

})(window);
