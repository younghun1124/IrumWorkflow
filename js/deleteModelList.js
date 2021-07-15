const deleteButtons = document.querySelectorAll("#delete");
for (const deleteButton of deleteButtons) {
  deleteButton.addEventListener("click", deleteAjax);
}

function deleteAjax(event) {
  console.log("click!");
  var 글번호 = event.target.dataset.id;
  event.preventDefault();
  $.ajax({
    method: "DELETE",
    url: "/delete",
    data: { _id: 글번호 },
  })
    .done(function (결과) {
      event.target.parentElement.remove();
    })
    .fail(function (a, b, c) {
      alert(`삭제실패! ${c}`);
    });
}
