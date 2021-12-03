(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        var pt = patient.read();
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });

        alert("test");
        var header = null;
        if (smart.server.auth.type === 'bearer') {

          header = 'Bearer ' + smart.server.auth.token;
          alert(header);
       }
       var testData = getSmartCard(header);
        // var client1 = new FHIR.client({
        //     serverUrl: "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d"
        // });
        //
        // var result = client1.request({
        //     url: "/Patient/12724065/$health-cards-issue",
        //     method: "POST",
        //     body: "{\"resourceType\":\"Parameters\","
        //           + "\"parameter\":["
        //           +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#immunization\"},"
        //           +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#covid19\"}]}"
        // });

        $.when(pt, obv).fail(onError);

        $.when(pt, obv).done(function(patient, obv) {

          var byCodes = smart.byCodes(obv, 'code');
          var ident = patient.id;
          var gender = patient.gender;

          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
          var immun = "1";

          var p = defaultPatient();
          p.ident = ident;
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);

          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);
          p.immun = immun;

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function getSmartCard(header){
    try
    {
        const url = "https://fhir-open.stagingcerner.com/beta/ec2458f2-1e24-41c8-b71b-0e701af7583d/Patient/12724065/$health-cards-issue";
        const request = new XMLHttpRequest();
        request.open("POST", url, false);
        request.onreadystatechange = () => {
          if (request.readyState === 4) {
            if (request.DONE && request.status === 200) {
              alert("success");
              resolve(JSON.parse(request.responseText));
            }
          //	reject(`Status service returned statusother than 200 (${request.status} ${request.responseText})`);
            alert("Failure");
            reject("Status service returned statusother than 200 ");
          }
        };
        request.setRequestHeader("Accept", "application/fhir+json");
        request.setRequestHeader("Content-Type", "application/fhir+json");
        request.setRequestHeader("Authorization ", header);
        const body: "{\"resourceType\":\"Parameters\","
                   + "\"parameter\":["
                   +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#immunization\"},"
                   +  "{\"name\":\"credentialType\",\"valueUri\":\"https://smarthealth.cards#covid19\"}]}";
        request.send(body);
      }
      catch (err) {
      //	reject(`Failed due to ${err.description}`);
        reject("Failed due to error");
      }
  }

  function defaultPatient(){
    return {
      ident: {value: ''},
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      immun: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
