//Wizard Init

$("#wizard").steps({
	headerTag: "h3",
	bodyTag: "section",
	transitionEffect: "none",
	stepsOrientation: "vertical",
	titleTemplate: '<span class="number">#index#</span>',
	onStepChanging: async function (event, currentIndex, newIndex) {
		console.log(currentIndex, "onChanging");

		if (newIndex == 2) {
			let shouldChange = false;
			let hostname = $("#hostname").val();
			let username = $("#username").val();
			let password = $("#password").val();
			let database = $("#database").val();

			let res = await $.post("/connection", {
				hostname,
				username,
				password,
				database,
			});
			if (res.status) {
				console.log(res.tables);

				// Get a reference to the select element
				const selectElement = document.getElementById("selectTable");

				// Loop through the table names and create option elements
				res.tables.forEach((tableName) => {
					const option = document.createElement("option");
					option.value = tableName; // You can set the value to the table name if needed
					option.text = tableName;
					selectElement.appendChild(option);
				});
				shouldChange = true;
			} else {
				alert("Connection Error");
			}
			return shouldChange;
		} else if (newIndex == 3) {
			//
			// alert(checkedAction)
			// if(checkedAction == "Export"){
			//     alert("here")
			//     return 5
			// }else{
			// }
		} else if (newIndex == 4) {
			const checkedAction = $("input[name='action']:checked").val();
			if (checkedAction == "Import") {
				const mappingPairs = document.querySelectorAll(".mapping-pair");
				const columnMapping = {};

				mappingPairs.forEach((mappingPair, index) => {
					const dbSelect = mappingPair.querySelector(".db-select");
					const sheetSelect = mappingPair.querySelector(".sheet-select");

					const selectedDBColumn = dbSelect.value;
					const selectedSheetColumn = sheetSelect.value;

					if (selectedDBColumn && selectedSheetColumn) {
						columnMapping[selectedDBColumn] = selectedSheetColumn;
					}
				});

				// Optionally, you can skip some database columns by not including them in the mapping object

				// Display the column mapping (you can do whatever you want with it)
				console.log(columnMapping);

				let res = await $.post("/import", {
					columns: { ...columnMapping },
					pathToFile,
					db_conf_table_name: $("#selectTable").val(),
					db_conf_table_host: $("#hostname").val(),
					db_conf_table_user: $("#username").val(),
					db_conf_table_pass: $("#password").val(),
					db_conf_table_db: $("#database").val(),
				});
				if (res.status) {
					document.getElementById("step5Heading").innerText = "Completed";
					document.getElementById("step5Status").innerText =
						"Imported Successfully";
				} else {
					document.getElementById("step5Heading").innerText = "Error Occured";
					document.getElementById("step5Status").innerText = res.error.message;
					console.log(res.error);
				}
			} else if (checkedAction == "Export") {
				alert("exporting");

				try {
					let response = await $.post("/export", {
						table: $("#selectTable").val(),
						host: $("#hostname").val(),
						user: $("#username").val(),
						pass: $("#password").val(),
						db: $("#database").val(),
					});
					// console.log(response);
					// const blob = new Blob([response], {
					// 	type: "application/octet-stream",
					// });
					// const url = window.URL.createObjectURL(blob);

					// // Create a temporary <a> element to trigger the download
					// const a = document.createElement("a");
					// a.href = url;
					// a.download = "export-" + Date.now() + ".csv";
					// a.style.display = "none";
					// document.body.appendChild(a);

					// // Trigger the download
					// a.click();

					// // Clean up
					// document.body.removeChild(a);
					// window.URL.revokeObjectURL(url);
					document.getElementById("step5Heading").innerText = "Completed";
					document.getElementById("step5Status").innerText =
						"Exported Successfully. The file should be downloading any minute now.";
					if (response.status) {
						window.location = String("/" + response.filePath).replace(
							"/public",
							""
						);
					}
				} catch (error) {
					document.getElementById("step5Heading").innerText = "Error Occured";
					document.getElementById("step5Status").innerText = error.message;
					console.log(error);
				}
			}
		} else {
			return true;
		}
	},
	onStepChanged: function (event, currentIndex, priorIndex) {
		console.log("Changed : ", currentIndex, event);

		if (currentIndex == 3) {
			const checkedAction = $("input[name='action']:checked").val();
			if (checkedAction == "Export") {
				$("#wizard").steps("next");
			}
		}
		if (currentIndex == 4) {
			$(".actions [href='#finish']").hide();
			$(".actions [href='#previous']").hide();
		}
	},
	onCanceled: function (event) {
		console.log(currentIndex, "onCancelled");
	},
	onFinishing: function (event, currentIndex) {
		console.log(currentIndex, "on Finishing");
		return true;
	},
	onFinished: function (event, currentIndex) {
		console.log(currentIndex, "on Finished");
	},
});

//Form control

$(".purpose-radio-input").on("change", function (e) {
	$("#business-type").text(e.target.value);
});

$("#firstName").on("change", function (e) {
	$("#enteredFirstName").text(e.target.value || "Cha");
});

$("#lastName").on("change", function (e) {
	$("#enteredLastName").text(e.target.value || "Ji-Hun C");
});

$("#phoneNumber").on("change", function (e) {
	$("#enteredPhoneNumber").text(e.target.value || "+230-582-6609");
});

$("#emailAddress").on("change", function (e) {
	$("#enteredEmailAddress").text(e.target.value || "willms_abby@gmail.com");
});
