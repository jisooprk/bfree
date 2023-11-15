/* 콘텐츠 탭 */
var contentsTab = function contentsTab() {
	var tabs = document.querySelectorAll('[role="tab"]');
	var tabLists = document.querySelectorAll('[role="tablist"]');

	tabs.forEach(function (tab) {
		if(tab.getAttribute("aria-selected") == "true") {
			tab.tabIndex = 0;
		}else{
			tab.tabIndex = -1;
		}
		
		tab.addEventListener("click", function (e) {
			var parent = tab.parentNode.tagName === "LI" ? tab.parentNode.parentNode : tab.parentNode;
			var panelWrap = document.querySelector('#' + tab.getAttribute("aria-controls")).parentNode;

			parent.querySelectorAll('[aria-selected="true"]').forEach(function (t) {
				t.setAttribute("aria-selected", false);
				t.tabIndex = -1;
			});

            parent.querySelectorAll('li').forEach(function (i) {
                i.classList.remove('active');
            });

			tab.setAttribute("aria-selected", true);
			tab.tabIndex = 0;
            tab.parentNode.classList.add('active');
			
			panelWrap.querySelectorAll('[role="tabpanel"]').forEach(function (p) {
				if(document.querySelector('[aria-controls="'+p.id+'"]').getAttribute("aria-selected") !== "true" ){
					p.style.display = "none";
				}
			});

			panelWrap.querySelector('#' + tab.getAttribute("aria-controls")).style.display = "block";
			e.preventDefault();
		});
	});
};

contentsTab();

/* 공통 전역변수 */
const commUiVar = {
	openClass : 'is-open', /* 오픈 클래스명 */
	focusElements : 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled], .btn-clear), [tabindex="0"], [data-focus-on="true"]', /* 웹접근성 포커스 요소 */
	activeTF : { 
		popup : false,
	},
	popupZIndex : 20
};

/* 웹접근성 포커스 연결 및 해제 */
const commUiFnFocus = {
	/* 단일 요소 포커스 연결 */
	focus : (_element) => {
		commUiFnFocus.set(_element, 0);
	},
	/* 히든 영역 포커스 연결 */
	onFocus : (_element) => {
		const findFocusElement = _element.querySelectorAll(commUiVar.focusElements);
		findFocusElement.forEach(function(_this) {
			commUiFnFocus.set(_this, 0);
		});
	},
	/* 단일 요소 포커스 해제 */
	blur : (_element) => {
		commUiFnFocus.set(_element, -1);
	},
	/* 히든 영역 포커스 해제 */
	onBlur : (_element) => {
		const findFocusElement = _element.querySelectorAll(commUiVar.focusElements);
		findFocusElement.forEach(function(_this) {
			commUiFnFocus.set(_this, -1);
		});
	},
	/* 반영 */
	set : (_target, _tabIndex) => {
		if (_target.classList.contains('select-data')) {
			return false;
		}
		_target.setAttribute('tabindex', _tabIndex);
		if (_tabIndex === 0) {
			_target.setAttribute('aria-hidden', false);
		} else {
			_target.setAttribute('aria-hidden', true);
		}
	}
};

/* 팝업 - 다중 오픈 처리 */
const commUiFnPopup = {
	/* 전역변수 */
	comm : {
		openId : [], /* 팝업 오픈한 버튼 저장, 닫기 시 포커스 이동에 필요 */
		openOrder : 0 /* 오픈 시 카운팅, 다중 오픈 처리에 필요 */
	},
	/* 초기실행 */
	init : () => {
		commUiFnPopup.focusSet();
		commUiFnPopup.openSet();
		commUiFnPopup.closeSet();
	},
	/* 웹접근성 포커스 세팅 */
	focusSet : () => {
		const subWrap = document.querySelectorAll('.popup-wrap');
		subWrap.forEach(function(_this) {
			commUiFnFocus.onBlur(_this);
		});
	},
	/* 웹접근성 대응 : 키 이벤트 연결 */
	keyEvent : (_element) => {
		const focusElement = _element.querySelectorAll(commUiVar.focusElements);
		const firstFocus = focusElement[0];
		const lastFocus = focusElement[focusElement.length - 1];

		/* 첫번째 요소에서 탭+쉬프트키 */
		firstFocus.addEventListener('keydown', commUiFnPopup.keyFocusFirst);
		/* 마지막 요소에서 탭키 */
		lastFocus.addEventListener('keydown', commUiFnPopup.keyFocusLast);
	},
	/* 첫번째 요소에서 탭+쉬프트키 */
	keyFocusFirst : (_event) => {
		const element = _event.target.closest('.popup-wrap');
		const focusElement = element.querySelectorAll(commUiVar.focusElements);
		const firstFocus = focusElement[0];
		const lastFocus = focusElement[focusElement.length - 1];

		if (_event.keyCode === 9 && _event.shiftKey && _event.target === firstFocus) {
			_event.preventDefault();
			lastFocus.focus();
		}
	},
	/* 마지막 요소에서 탭키 */
	keyFocusLast : (_event) => {
		const element = _event.target.closest('.popup-wrap');
		const focusElement = element.querySelectorAll(commUiVar.focusElements);
		const firstFocus = focusElement[0];
		const lastFocus = focusElement[focusElement.length - 1];

		if (_event.keyCode === 9 && !_event.shiftKey && _event.target === lastFocus) {
			_event.preventDefault();
			firstFocus.focus();
		}
	},
	/* 열기 - 실행 */
	open : (_target) => {
		const thisPopupWrap = document.querySelector(_target);
		if (!thisPopupWrap) return;

		commUiVar.popupZIndex++;
		commUiFnPopup.comm.openOrder++;

		thisPopupWrap.style.zIndex = commUiVar.popupZIndex;
		thisPopupWrap.classList.add(commUiVar.openClass);

		commUiVar.activeTF.popup = commUiFnPopup.comm.openOrder; /* 히든요소 활성화 체크 */

		/* 포커싱 처리 */
		thisPopupWrap.setAttribute('aria-hidden', false);
		document.querySelector(_target + ' .popup-inner').focus();

		/* 히든 영역 포커스 연결 */
		commUiFnFocus.onFocus(thisPopupWrap);

		commUiFnPopup.keyEvent(thisPopupWrap);
	},
	/* 열기 - 타겟 이벤트 추가 */
	openSet : () => {
		const btnPopupOpen = document.querySelectorAll('.fn-popup-open');
		btnPopupOpen.forEach(function(_this) {
			_this.addEventListener('click', function() {
				const popupId = _this.dataset.popupId;
				commUiFnPopup.open(popupId);

				/* 오픈한 버튼 저장(닫기 시 포커스 이동 처리), 다중 팝업 고려하여 배열에 추가 */
				commUiFnPopup.comm.openId.push(_this);

				/* .option-guide 오픈 버튼 z-index 처리 */
				if (_this.classList.contains('btn-popup-guide-open')) {
					_this.style.zIndex = `0`;
				}
			});
		});
	},
	/* 닫기 - 실행 */
	close : (_target) => {
		commUiVar.popupZIndex--;
		commUiFnPopup.comm.openOrder--;
		const thisPopupWrap = document.querySelector(_target);

		thisPopupWrap.classList.remove(commUiVar.openClass);
		setTimeout(() => {
			thisPopupWrap.removeAttribute('style');
		}, commUiVar.animationSpeed);

		commUiVar.activeTF.popup = commUiFnPopup.comm.openOrder; /* 히든요소 활성화 체크 */

		/* 포커싱 처리 */
		thisPopupWrap.setAttribute('aria-hidden', true);
		commUiFnFocus.onBlur(thisPopupWrap); /* 히든 영역 포커스 해제 */

		/* 오픈한 버튼 저장(닫기 시 포커스 이동 처리), 다중 팝업 고려하여 배열에 추가 */
		commUiFnPopup.comm.openId[commUiFnPopup.comm.openOrder].focus();
		commUiFnPopup.comm.openId.pop();
	},
	/* 닫기 - 타겟 이벤트 추가 */
	closeSet : () => {
		const btnPopupClose = document.querySelectorAll('.fn-popup-close');
		btnPopupClose.forEach(function(_this) {
			_this.addEventListener('click', function() {
				const popupId = _this.dataset.popupId;
				commUiFnPopup.close(popupId);
			});
		});

		const subWrap = document.querySelectorAll('.popup-wrap');
		subWrap.forEach(function(_this) {
			_this.addEventListener('keydown', function(_event) {
				if (_event.keyCode === 27) {
					commUiFnPopup.close(_this.querySelector('.fn-popup-close').dataset.popupId);
				}
			});
		});
	}
}
commUiFnPopup.init();

/* 팝업 닫기 */
if (commUiVar.activeTF.popup > 0) {
	if (_event.target.classList.contains('popup-wrap') && _event.target.classList.contains(commUiVar.openClass)) {
		commUiFnPopup.close('#' + _event.target.id);
	}
}