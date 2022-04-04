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
        alert("testLatest");

        var patientId = null;
        if (smart.tokenResponse) {
             patientId = smart.tokenResponse.patient;
             var encounterId = smart.tokenResponse.encounter;
             var userId = smart.tokenResponse.user;
        }

        callHealthCardEndpoint(ret,patientId)

      }
      else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
};

function callHealthCardEndpoint(ret,patientId)
{
  alert("innn");
  alert(patientId);
  patientId = 12724065;// 3374491 // 3213970 // 12724065 //12724069
  var url = "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/" + patientId + "/$health-cards-issue";
  //var url = "https://fhir-myrecord.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/"+ patientId +"/$health-cards-issue"

  var request = new XMLHttpRequest();
  request.open("POST", url, true);
  request.onreadystatechange = function() {
    if (request.readyState === 4) {
      if (request.DONE && request.status === 200) {
        var testData = JSON.parse(request.response);
        decodeAndVerifyJWSSignature(ret,testData?.parameter[0]?.valueString);
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

function decodeAndVerifyJWSSignature(ret,jwsToken)
{
  var url1 = "https://fhir-open.stagingcerner.com/beta/admin/health-cards/decode";
  var request1 = new XMLHttpRequest();
  request1.open("POST", url1, true);
  request1.onreadystatechange = function() {
    if (request1.readyState === 4) {
      if (request1.DONE && request1.status === 200) {
        var immunizationData = JSON.parse(request1.response);
        createTable(ret,jwsToken,immunizationData);
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

function createTable(ret,jwsToken,immunizationData)
{
    var immun = '<table id="ImmunInfo" class="tableBorder">'
                +'<tr>'
                +'<td>'+ i18n.Immunization.COVID_VACCINATION_RECORD_CARD + '</td>'
                +'<td>Healthe Clinic Image</td>'
                +'</tr>';

    var entryLength = immunizationData.vc.credentialSubject.fhirBundle.entry.length;

    for (var entryIndex = 0; entryIndex < entryLength; entryIndex++) {
      var entry = immunizationData.vc.credentialSubject.fhirBundle.entry[entryIndex];
      if (entry.resource.resourceType == 'Patient') {

         immun = immun
                     +'<tr>'
                     +'<th>'+ i18n.Immunization.NAME +'</th>'
                     +'<th>'+ i18n.Immunization.BIRTHDATE +'</th>'
                     +'</tr>'
                     +'<tr>'
                     +'<td>' + entry.resource.name[0].given[0] + ' '+ entry.resource.name[0].family + '</td>'
                     +'<td>' + entry.resource.birthDate + '</td>'
                     +'</tr>'
                     +'</table>'
                     +'<table id="ImmunInfo" class="tableBorder">';
      }
      if (entry.resource.resourceType == 'Immunization') {
        immun = immun
              +'<tr id="vaccineInfo"><td class="grayBorder">1</td><td  class="grayBorder">Covid-19 Vaccine</td></tr>'
              +'<tr id="vaccineInfo"><td class="grayBorder">1</td><td  class="grayBorder">Covid-19 Vaccine</td></tr>'
              + '</table>';
      }
    }

  //  var immunInfo =
  immun = immun
          + '<table class="tableBorder">'
          + '<tr><td class="grayBorder">' + i18n.Immunization.HEALTH_CARD_INFOMATION_ONE +'<td></tr>'
          + '<tr><td class="grayBorder">' + i18n.Immunization.HEALTH_CARD_INFOMATION_ONE +'<td></tr>'
          + '<tr><td class="grayBorder">' + i18n.Immunization.HEALTH_CARD_INFOMATION_ONE +'<td></tr>'
          + '</table>';

    var qrcode = new QRCode(document.getElementById("qrcode"), {
       text: jwsToken,
       width: 128,
       height: 128,
       colorDark : "#000000",
       colorLight : "#ffffff",
       correctLevel : QRCode.CorrectLevel.H
     });

    var p = defaultPatient();
    p.immun = immun;
    // p.immunInfo = immunInfo;
    ret.resolve(p);
}

 function defaultPatient(){
    return {
        immun: {value: ''},
        // immunInfo: {value: ''},
    };
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#immun').html(p.immun);
    // $('#immunInfo').html(p.immunInfo);
  };

})(window);
