var calendar_data;

$(function(){
	var datepicker1 = $('#datepicker1').val()
	var datepicker2 = $('#datepicker2').val()
	var timepicker1 = $('#timepicker1').val()
	var timepicker2 = $('#timepicker2').val()

	$("#todos").on("click", "a.showd", function(){
		if (calendar_data) {
			getDetail($(this).index());
		} else {
			alert("資料不存在");
		}
	});

	$("#allday").on("click", function() {
		// true 的話為全天，全天不用時間
		var startTime = "<input type='text' class='form-control datetimepicker-input col-md-2' id='timepicker1' name='timepicker1' data-toggle='datetimepicker' data-target='#timepicker1'>";
		var endTime = "<input type='text' class='form-control datetimepicker-input col-md-2' id='timepicker2' name='timepicker2' data-toggle='datetimepicker' data-target='#timepicker2'>";

		if ($(this).is(":checked")) {
			$("#timepicker1").remove();
			$("#timepicker2").remove();
		} else {
			$("#datepicker1").after(startTime);
			$("#datepicker2").before(endTime);

			// 新增動態給格式
			$('#timepicker1').datetimepicker({
		    	format: 'HH:mm'
		    });
		    $('#timepicker2').datetimepicker({
		    	format: 'HH:mm',
		        useCurrent: false
		    });
		}
	})

    $('#datepicker1').datetimepicker({
    	format: 'YYYY年MM月DD日'
    });
    $('#datepicker2').datetimepicker({
    	format: 'YYYY年MM月DD日',
    	useCurrent: false
    });

    $('#timepicker1').datetimepicker({
    	format: 'HH:mm'
    });
    $('#timepicker2').datetimepicker({
    	format: 'HH:mm',
    	useCurrent: false
    });

    $("#datepicker1").val(datepicker1)
    $("#datepicker2").val(datepicker2)
    $("#timepicker1").val(timepicker1)
    $("#timepicker2").val(timepicker2)

    $("#datepicker1").on("change.datetimepicker", function (e) {
        $('#datepicker2').datetimepicker('minDate', e.date);
    });
    $("#datepicker2").on("change.datetimepicker", function (e) {
        $('#datepicker1').datetimepicker('maxDate', e.date);
    });
});

// 讀取 google calendar api
function loadCalendar() {
	console.log("load items")

	$.ajax({
		url: "/load",
		method: 'get',
		contentType: 'application/json',
		success: function(data){
			// console.log(data)
			var todoList = $("#todos");
			var detail = $("#detail");
			todoList.empty();
			detail.empty();

			if (!data.msg) {
				calendar_data = data;
				console.log('load items success.');

				var html = "";
				for (var i = 0; i < data.length; i++) {
					var event = data[i];

					html += "<a class='list-group-item list-group-item-action flex-column align-items-start showd' style='cursor:pointer;'><div class='d-flex w-100 justify-content-between'>";

					html += "<h6 class='mb-1'>" + event.summary + "</h6>";

					html += "<small>";
					if (event.start.date == undefined) {
						html += event.start.dateTime.split("T")[0];
					} else {
						html += event.start.date;
					}
					html += "</small></div></a>";
				}
				todoList.append("<ul class='list-group'>" + html + "</ul>");
			} else {
				$("#alert_holder").append("<div class='alert alert-danger' role='alert'>"+data.msg+"</div>");
			}
		},
	});
}

// 取得存放於前台的資料, event.id已加密
function getDetail(index) {
	console.log(calendar_data[index]);

	const event = calendar_data[index];
	const detail = $("#detail");
	detail.empty();

	var html = "";
	html += "<ul class='list-group list-group-flush'>";

	html += "<li class='list-group-item'>";
	html += "<a href='/edit/"+event.id+"' class='btn btn-outline-info btn-spacing'>";
	html += "編輯";
	html += "</a>";
	html += "<button type='button' class='btn btn-outline-danger btn-spacing' onclick='deleteEvent("+index+")'>";
	html += "刪除";
	html += "</button>";
	html += "</li>";

	html += "<li class='list-group-item'>標題："+ event.summary +"</li>";

	if (event.created) {
		html += "<li class='list-group-item'>建立日期："+ event.created.split('T')[0] +"</li>";
	}

	if (event.location) {
		html += "<li class='list-group-item'>地點："+ event.location +"</li>";
	}

	html += "<li class='list-group-item'>";
	if (event.start.date) {
		html += "開始：" + event.start.date
	} else {
		html += "開始：" + event.start.dateTime.split('T')[0]
		html += " " + event.start.dateTime.split('T')[1]
	}
	html += "<br>";
	if (event.end.date) {
		html += "結束：" + event.end.date
	} else {
		html += "結束：" + event.end.dateTime.split('T')[0]
		html += " " + event.end.dateTime.split('T')[1]
	}
	html += "</li>";


	if (event.description) {
		html += "<li class='list-group-item'>"+ event.description +"</li>";
	}

	html += "</ul>";
	detail.append(html);
}

// 新增事件
function storeEvent() {
	var postData = $('form').serialize();

	$.ajax({
		url: "/store",
		data: postData,
		method: 'post',
		dataType: 'json',
		success: function(data){
			if (data.result == '1') { // 成功
				$("#alert_holder").append("<div class='alert alert-success alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
			} else {
				console.log('err');
				$("#alert_holder").append("<div class='alert alert-danger alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
			}
		},
	});
}

function updateEvent(eid) {
	$.ajax({
		url: "/update",
		data: $('form').serialize() + "&eventId=" + eid, // 額外加入 event id
		method: 'post',
		dataType: 'json',
		success: function(data){
			if (data.result == '1') { // 成功
				$("#alert_holder").append("<div class='alert alert-success alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
			} else {
				console.log('err');
				$("#alert_holder").append("<div class='alert alert-danger alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
			}
		},
	});
}

// 刪除事件
function deleteEvent(index) {
	const eventId = calendar_data[index].id;

	if (confirm("確定要移除項目嗎？")) {
		$.ajax({
			url: "/remove",
			data: {'id':eventId},
			method: 'post',
			dataType: 'json',
			success: function(data){
				if (data.result == '1') { // 成功
					// 刪除後觸發loading事件
					loadCalendar();
					$("#alert_holder").append("<div class='alert alert-success alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
				} else {
					$("#alert_holder").append("<div class='alert alert-danger alert-dismissible' role='alert'>"+data.msg+"<button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button></div>");
				}
			},
		});
	}
}
