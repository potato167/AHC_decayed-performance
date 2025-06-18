// ==UserScript==
// @name         AtCoder Heuristic decayed performance display
// @namespace    https://github.com/potato167/AHC_decayed-performance
// @version      1.0
// @description  AHCの寄与値をパフォと新レーティングの間に表示（色付き・ソート対応）
// @match        https://atcoder.jp/users/*/history?contestType=heuristic
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    if (!location.href.includes("contestType=heuristic")) return;

    function parseDate(dateStr) {
        const match = dateStr.trim().match(/^(\d{4}-\d{2}-\d{2})\([^)]+\)\s+(\d{2}:\d{2})$/);
        if (!match) return null;
        const isoStr = `${match[1]}T${match[2]}:00`;
        const date = new Date(isoStr);
        return isNaN(date) ? null : date;
    }

    function daysSince(date) {
        const now = new Date();
        return (now - date) / (1000 * 60 * 60 * 24);
    }

    function computeContribution(p_prime, d) {
        return 150 + p_prime - 100 * (d / 365);
    }

    function round(x) {
        return Math.round(x);
    }

    function colorizeCellBackground(cell, value) {
        if (isNaN(value)) return;
        const v = Number(value);
        const color =
            v < 400  ? '#D9D9D9' :
            v < 800  ? '#D9C5B2' :
            v < 1200 ? '#B2D9B2' :
            v < 1600 ? '#B2ECEC' :
            v < 2000 ? '#B2B2FF' :
            v < 2400 ? '#ECECB2' :
            v < 2800 ? '#FFD9B2' :
            v < 3200 ? '#FFB2B2' :
            v < 3600 ? 'linear-gradient(135deg, #E4E4E4, #EEEEEE, #CCCCCC)' :
                      'linear-gradient(135deg, #FFD325, #FDEBA6, #FFE065)';

        if (color.startsWith('linear-gradient')) {
            cell.style.backgroundImage = color;
        } else {
            cell.style.backgroundColor = color;
        }
    }

    const waitForTable = setInterval(() => {
        const table = document.querySelector("table");
        if (!table || !$(table).hasClass("dataTable")) return;

        clearInterval(waitForTable);
        const $table = $(table);
        const dataTable = $table.DataTable();

        // 1. ヘッダーに <th> をパフォーマンスと新レーティングの間に追加
        const $headerRow = $table.find("thead tr");
        const $th = $('<th>減衰</th>');
        $headerRow.find('th').eq(3).after($th); 

        // 2. 各行に <td> を挿入（6番目）
        $table.find("tbody tr").each(function () {
            const $row = $(this);
            const $tds = $row.find("td");

            const dateText = $tds.eq(0).text().trim();
            const perfText = $tds.eq(3).text().trim();
            const perf = parseFloat(perfText);
            const date = parseDate(dateText);

            const td = document.createElement("td");

            if (!date || isNaN(perf)) {
                td.innerText = "-";
                td.dataset.sort = "0";
            } else {
                const d = daysSince(date);
                const contrib = round(computeContribution(perf, d));
                td.innerText = contrib.toString();
                td.dataset.sort = contrib;
                colorizeCellBackground(td, contrib);
            }

            // 6番目の位置に差し込む（before td[6]）
            const target = $tds[4];
            $row[0].insertBefore(td, target);
        });

        // 3. 再初期化
        const currentOrder = dataTable.order();
        dataTable.destroy();

        $table.DataTable({
            order: currentOrder,
            paging: false,
            searching: false,
            info: false,
            lengthChange: false,
            columnDefs: [
                {
                    targets: 6, // 寄与列の位置
                    type: 'num'
                }
            ]
        });
    }, 200);
})();
