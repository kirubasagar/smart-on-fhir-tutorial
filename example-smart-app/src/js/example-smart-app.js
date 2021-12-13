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
        alert("test");

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
          callHealthCardEndpoint(ret,patient,patientId)
        });
      }
      else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
};

function callHealthCardEndpoint(ret,patient,patientId)
{
  patientId = 12724065;// 3374491 // 3213970
  var url = "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/" + patientId + "/$health-cards-issue";

  var request = new XMLHttpRequest();
  request.open("POST", url, true);
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.DONE && request.status === 200) {
        var testData = JSON.parse(request.response);
        decodeAndVerifyJWSSignature(ret,patient,testData.parameter[0].valueString);
      }
      else {
         alert("faliure");
         alert(request.status);
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

function decodeAndVerifyJWSSignature(ret,patient,jwsToken)
{
  var url1 = "https://fhir-open.stagingcerner.com/beta/admin/health-cards/decode";
  var request1 = new XMLHttpRequest();
  request1.open("POST", url1, true);
  request1.onreadystatechange = function() {
    if (request1.readyState === 4) {
      if (request1.DONE && request1.status === 200) {
        var immunizationData = JSON.parse(request1.response);
        createTable(ret,patient,jwsToken,immunizationData);
      }
    }
  }

  request1.setRequestHeader("Accept", "application/fhir+json");
  request1.setRequestHeader("Content-Type", "application/fhir+json");
  var body1 = "{\"jws\":\""
            + jwsToken + "\","
            + "\"verify_signature\":"
            + true
            + "}";
  request1.send(body1);
}

function createTable(ret,patient,jwsToken,immunizationData)
{
    alert(immunizationData.vc.credentialSubject.fhirBundle.entry.length);

    var fname = '';
    var lname = '';

    for (int entryIndex = 0; entryIndex < immunizationData.vc.credentialSubject.fhirBundle.entry.length; entryIndex++)
    {
      var entry = immunizationData.vc.credentialSubject.fhirBundle.entry[entryIndex];
      if (entry.resource.resourceType == 'Patient')
      {
         fname = entry.resource.name[0].given.join(' ');
         lname = entry.resource.name[0].family.join(' ');
      }
    }

    // if (typeof patient.name[0] !== 'undefined') {
    //    fname = patient.name[0].given.join(' ');
    //    lname = patient.name[0].family.join(' ');
    // }

    var qrcode = new QRCode(document.getElementById("qrcode"), {
       text: jwsToken,
       width: 128,
       height: 128,
       colorDark : "#000000",
       colorLight : "#ffffff",
       correctLevel : QRCode.CorrectLevel.H
     });

    var immun = '<table id="ImmunInfo">'
                +'<tr>'
                +'<td>Covid-19 Vaccination Record Card</td>'
                +'<td>Healthe Clinic Image</td>'
                +'</tr>'
                +'<tr>'
                +'<th>'+ i18n.Immunization.NAME +'</th>'
                +'<th>'+ i18n.Immunization.BIRTHDATE +'</th>'
                +'</tr>'
                +'<tr>'
                +'<td>' + fname + ' '+ lname + '</td>'
                +'<td>' + patient.birthDate +'</td>'
                +'</tr>'
                +'<tr><th id="ImmunName">1</th><td id="ProductName">Covid-19 Vaccine</td></tr>'
                +'<tr><th id="ImmunName">2</th><td id="ProductName">Covid-19 Vaccine</td></tr>'
                + '</table>';

    var p = defaultPatient();
    p.immun = immun;
    ret.resolve(p);
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
