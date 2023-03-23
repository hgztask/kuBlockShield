// ==UserScript==
// @name         库街区屏蔽增强器
// @namespace    http://tampermonkey.net/
// @license      MIT
// @version      0.1
// @description  根据用户名、帖子预览内容关键词、浏览量、评论量、点赞（收藏量进行屏蔽）
// @author       byhgz
// @match        *://www.kurobbs.com/*
// @require      https://code.jquery.com/jquery-3.5.1.min.js
// @icon         https://web-static.kurobbs.com/resource/prod/icon.png
// @grant        none
// ==/UserScript==


const rule = {
    /**
     * 用户名黑名单模式（精确匹配）
     * {String[]}
     */
    nameArr: [""],
    /**
     * 用户名黑名单模式（模糊匹配）
     * {String[]}
     */
    nameKeyArr: ["原神", "崩坏", "舰长"],
    /**
     * 帖子标题黑名单模式（模糊匹配）
     * {String[]}
     */
    titleKeyArr: ["感觉不如", "差不多得了"],
    /**
     * 帖子预览内容关键词黑名单模式（模糊匹配）
     */
    contentPreview: ["抄袭"],
    /**
     * 图片黑名单模式(精确匹配)
     * 是否过滤帖子内容仅仅是图片的帖子，不包含文本内容的帖子
     */
    isContentPicture: false,
    /**
     * 访问量最小值
     */
    visitsMin: 0,
    /**
     * 访问量最大值
     */
    visitsMax: 0,
    /**
     * 点赞量最小值
     */
    likesMin: 0,
    /**
     * 点赞量最大值
     */
    likesMax: 0,
    /**
     * 评论量最小值
     */
    commentVolumeMin: 0,
    /**
     * 评论量最大值
     */
    commentVolumeMax: 0,


};


//删除元素
const remove = {
    /**
     * 根据用户提供的网页元素和对应的数组及key，判断数组里是否完全等于key元素本身
     * @param arr 数组
     * @param key 唯一key
     * @returns {boolean}
     */
    shieldArrKey: function (arr, key) {
        if (arr == null) {
            return false;
        }
        return !!arr.includes(key);
    },
    /**
     * 根据用户提供的字符串集合，当content某个字符包含了了集合中的某个字符则返回对应的字符
     * 反之返回null
     * @param arr 字符串数组
     * @param content 内容
     * @returns {null|String}
     */
    shieldArrContent: function (arr, content) {
        try {
            for (let str of arr) {
                if (content.toLowerCase().includes(str)) {//将内容中的字母转成小写进行比较
                    return str;
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    }
}


const shield = {
    /**
     * 根据用户名屏蔽元素，当用户名完全匹配规则时屏蔽
     * @param element
     * @param name
     * @returns {boolean}
     */
    name: function (element, name) {
        if (remove.shieldArrKey(rule.nameArr, name)) {
            element.remove();
            return true;
        }
        return false;
    },
    nameKey: function (element, name) {
        const content = remove.shieldArrContent(rule.nameKeyArr, name);
        if (content === null) {
            return false;
        }
        element.remove();
        return content;
    },
    contentPreviewKey: function (element, name) {
        const content = remove.shieldArrContent(rule.contentPreview, name);
        if (content === null) {
            return false;
        }
        element.remove();
        return content;
    }


}


/**
 * 执行屏蔽帖子规则
 */
function sheInvitation() {
    const interval = setInterval(() => {
        const list = $(".post-list > .item");
        if (list.length === 0) {
            return;
        }
        clearInterval(interval);
        console.log(list);
        for (const e of list) {
            const name = e.getElementsByClassName("text-14 pointer")[0].textContent;
            const title = e.getElementsByClassName("post-title text-16 mb-4")[0].textContent;
            const visits = e.querySelector("div > span:nth-child(1)").textContent;//访问量
            const likes = e.querySelector("div > span:nth-child(3)").textContent;//点赞量
            const commentVolume = e.getElementsByClassName("flex-vertical-center mr-20 pd-6 pointer")[0].textContent;//评论量
            let content = e.getElementsByClassName("post-content txt-overflow-ellipsis-3 text-14 mb-4")[0];//预览内容
            let isContentPicture = true;//内容是否是图片
            if (content !== undefined) {
                content = content.textContent;
                isContentPicture = false;
            }
            if (shield.name(e, name)) {//是否是和名单用户
                console.log(`已通过用户名 屏蔽name=${name}  title=${title} 预览内容=${content}  内容是否是纯图片=${isContentPicture}`)
                continue;
            }
            const nameKey = shield.nameKey(e, name);
            if (nameKey!==null) {
                console.log(`已移除用户名关键词${nameKey} title=${title} 预览内容=${content}  内容是否是纯图片=${isContentPicture}`)
                continue;
            }
            const contentPreviewKey = shield.contentPreviewKey(e, content);
            if (contentPreviewKey !== null) {
                console.log(`已通过预览内容关键词${contentPreviewKey} 移除 name=${name}  title=${title} 预览内容=${content}  内容是否是纯图片=${isContentPicture}`)
            }
        }
    }, 1000);
}


(function () {
    'use strict';
    console.log("进入库街区");

    window.addEventListener('ajaxReadyStateChange', function (e) {//监听网络请求
        e.detail.onload = function () {
            const detail = e.detail;
            const responseURL = detail.responseURL;
            const response = detail.response;
            if (responseURL.includes("api.kurobbs.com/forum/list")) {
                console.log("检测到列表帖子加载了！")
                sheInvitation();
            }
        }
    });

})();


//监听ajax请求
(function () {
    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
})();
;(function () {
    function ajaxEventTrigger(event) {
        const ajaxEvent = new CustomEvent(event, {detail: this});
        window.dispatchEvent(ajaxEvent);
    }

    const oldXHR = window.XMLHttpRequest;

    function newXHR() {
        const realXHR = new oldXHR();

        realXHR.addEventListener('abort', function () {
            ajaxEventTrigger.call(this, 'ajaxAbort');
        }, false);

        realXHR.addEventListener('error', function () {
            ajaxEventTrigger.call(this, 'ajaxError');
        }, false);

        realXHR.addEventListener('load', function () {
            ajaxEventTrigger.call(this, 'ajaxLoad');
        }, false);

        realXHR.addEventListener('loadstart', function () {
            ajaxEventTrigger.call(this, 'ajaxLoadStart');
        }, false);

        realXHR.addEventListener('progress', function () {
            ajaxEventTrigger.call(this, 'ajaxProgress');
        }, false);

        realXHR.addEventListener('timeout', function () {
            ajaxEventTrigger.call(this, 'ajaxTimeout');
        }, false);

        realXHR.addEventListener('loadend', function () {
            ajaxEventTrigger.call(this, 'ajaxLoadEnd');
        }, false);

        realXHR.addEventListener('readystatechange', function () {
            ajaxEventTrigger.call(this, 'ajaxReadyStateChange');
        }, false);

        return realXHR;
    }

    window.XMLHttpRequest = newXHR;
})();
