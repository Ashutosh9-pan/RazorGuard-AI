const form = document.getElementById("riskForm");

const riskScore = document.getElementById("riskScore");
const riskLevel = document.getElementById("riskLevel");
const riskProbability = document.getElementById("riskProbability");
const riskBar = document.getElementById("riskBar");
const riskFactors = document.getElementById("riskFactors");
const factorCount = document.getElementById("factorCount");


/* ==========================================
   Transaction Analysis
========================================== */

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const button = document.querySelector(".analyze-btn");
    const originalText = button.innerHTML;

    button.innerHTML =
        "<span>Analyzing...</span><span>⏳</span>";

    button.disabled = true;


    const transaction = {

        amount:
            Number(document.getElementById("amount").value),

        account_age_days:
            Number(
                document.getElementById("account_age_days").value
            ),

        transactions_24h:
            Number(
                document.getElementById("transactions_24h").value
            ),

        failed_transactions_24h:
            Number(
                document.getElementById("failed_transactions_24h").value
            ),

        device_changes_30d:
            Number(
                document.getElementById("device_changes_30d").value
            ),

        location_mismatch:
            document.getElementById(
                "location_mismatch"
            ).checked ? 1 : 0,

        international_transaction:
            document.getElementById(
                "international_transaction"
            ).checked ? 1 : 0,

        previous_chargebacks:
            Number(
                document.getElementById("previous_chargebacks").value
            )
    };


    try {

        const response = await fetch("/api/analyze", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(transaction)
        });


        const data = await response.json();


        if (!response.ok) {
            throw new Error(
                data.error || "Analysis failed"
            );
        }


        displayResult(data.analysis);

    }


    catch (error) {

        console.error(
            "Risk analysis error:",
            error
        );


        riskLevel.textContent =
            "Analysis Failed";

        riskProbability.textContent =
            error.message;

        riskScore.textContent =
            "--";

        riskBar.style.width =
            "0%";


        riskFactors.innerHTML = `
            <div class="empty-state">
                Unable to analyze transaction.
                Please try again.
            </div>
        `;


        factorCount.textContent =
            "0";


        // Reset recommended action card

        const actionCard =
            document.getElementById("actionCard");


        if (actionCard) {

            actionCard.className =
                "action-card";


            const actionIcon =
                document.getElementById("actionIcon");

            const recommendedAction =
                document.getElementById(
                    "recommendedAction"
                );

            const actionDescription =
                document.getElementById(
                    "actionDescription"
                );


            if (actionIcon) {
                actionIcon.textContent = "⚠️";
            }


            if (recommendedAction) {

                recommendedAction.textContent =
                    "Unable to determine recommended action";
            }


            if (actionDescription) {

                actionDescription.textContent =
                    "Transaction analysis failed. Please try again.";
            }
        }

    }


    finally {

        button.innerHTML =
            originalText;

        button.disabled =
            false;
    }
});


/* ==========================================
   Amount at Risk / Estimated Exposure
========================================== */

function updateExposureEstimate(result) {

    const exposureAmount =
        document.getElementById("exposureAmount");

    const exposureTransactionAmount =
        document.getElementById("exposureTransactionAmount");

    const exposureRiskProbability =
        document.getElementById("exposureRiskProbability");

    const exposureRiskLevel =
        document.getElementById("exposureRiskLevel");

    const exposureDescription =
        document.getElementById("exposureDescription");

    if (
        !exposureAmount ||
        !exposureTransactionAmount ||
        !exposureRiskProbability ||
        !exposureRiskLevel ||
        !exposureDescription
    ) {
        return;
    }

    const amount =
        Number(result.amount ?? result.transaction?.amount ?? document.getElementById("amount")?.value ?? 0);

    const probability =
        Number(result.risk_probability || 0);

    const exposure =
        amount * probability;

    exposureAmount.textContent =
        Math.round(exposure).toLocaleString("en-IN");

    exposureTransactionAmount.textContent =
        `₹${Math.round(amount).toLocaleString("en-IN")}`;

    exposureRiskProbability.textContent =
        `${(probability * 100).toFixed(2)}%`;

    exposureRiskLevel.textContent =
        result.risk_level || "--";

    exposureRiskLevel.style.color =
        getRiskColor(result.risk_level);

    exposureDescription.textContent =
        `Estimated exposure = transaction amount × risk probability (${(probability * 100).toFixed(2)}%).`;
}


/* ==========================================
   Display Risk Analysis Result
========================================== */

function displayResult(result) {

    const score =
        Number(result.risk_score);

    const probability =
        Number(result.risk_probability);


    // Risk score

    riskScore.textContent =
        score.toFixed(2);


    // Risk level

    riskLevel.textContent =
        result.risk_level;


    // Probability

    riskProbability.textContent =
        `${(probability * 100).toFixed(2)}% probability of elevated risk`;


    // Progress bar

    riskBar.style.width =
        `${score}%`;


    // Risk circle

    const degrees =
        score * 3.6;


    document.querySelector(
        ".risk-circle"
    ).style.background =

        `conic-gradient(
            var(--primary) ${degrees}deg,
            #e8eaf0 ${degrees}deg
        )`;


    // Risk level styling

    riskLevel.style.color =
        getRiskColor(result.risk_level);


    // Risk factors

    const reasons =
        result.reasons || [];


    factorCount.textContent =
        reasons.length;


    if (reasons.length === 0) {

        riskFactors.innerHTML = `
            <div class="empty-state">
                No major risk indicators detected.
            </div>
        `;

    }

    else {

        riskFactors.innerHTML =
            reasons.map(reason => `

                <div class="factor">

                    <span class="factor-icon">
                        !
                    </span>

                    <span>
                        ${escapeHtml(reason)}
                    </span>

                </div>

            `).join("");
    }


    // Update estimated financial exposure

    updateExposureEstimate(result);


    // Update risk explanation

    updateRiskExplanation(result);


    // Update recommended defensive action

    updateRecommendedAction(result);


    // Refresh audit trail and dashboard statistics

    loadAuditTrail();
}


/* ==========================================
   Risk Explanation
========================================== */

function updateRiskExplanation(result) {

    const summary =
        document.getElementById("riskExplanationSummary");

    const signalsContainer =
        document.getElementById("riskExplanationSignals");

    if (!summary || !signalsContainer) {
        return;
    }

    const riskLevel =
        result.risk_level || "LOW";

    const score =
        Number(result.risk_score || 0);

    const reasons =
        result.reasons || [];

    if (reasons.length === 0) {
        summary.innerHTML = `
            <strong>Low-risk assessment.</strong>
            No major supporting risk indicators were detected for this transaction.
        `;

        signalsContainer.innerHTML = `
            <div class="explanation-empty">
                No major risk signals detected.
            </div>
        `;

        return;
    }

    const summaryText =
        riskLevel === "HIGH"
            ? `This transaction received a <strong>HIGH</strong> risk assessment with a score of <strong>${score.toFixed(2)}/100</strong>. The following supporting signals contributed to the decision.`
            : riskLevel === "MEDIUM"
                ? `This transaction received a <strong>MEDIUM</strong> risk assessment with a score of <strong>${score.toFixed(2)}/100</strong>. The following supporting signals were detected.`
                : `This transaction received a <strong>LOW</strong> risk assessment with a score of <strong>${score.toFixed(2)}/100</strong>. The following signals were reviewed.`;

    summary.innerHTML = summaryText;

    signalsContainer.innerHTML = reasons.map((reason, index) => `
        <div class="explanation-signal">
            <span class="explanation-signal-number">${index + 1}</span>
            <span>${escapeHtml(reason)}</span>
        </div>
    `).join("");
}


/* ==========================================
   Recommended Defensive Action
========================================== */

function updateRecommendedAction(result) {

    const actionCard =
        document.getElementById(
            "actionCard"
        );

    const actionIcon =
        document.getElementById(
            "actionIcon"
        );

    const recommendedAction =
        document.getElementById(
            "recommendedAction"
        );

    const actionDescription =
        document.getElementById(
            "actionDescription"
        );


    // Safety check

    if (
        !actionCard ||
        !actionIcon ||
        !recommendedAction ||
        !actionDescription
    ) {

        console.warn(
            "Recommended Action card not found in HTML."
        );

        return;
    }


    const riskLevel =
        result.risk_level;


    // Action generated by backend

    const action =
        result.recommended_action;


    recommendedAction.textContent =
        action ||
        "No recommended action available";


    // HIGH risk

    if (riskLevel === "HIGH") {

        actionIcon.textContent =
            "⛔";


        actionDescription.textContent =
            "Transaction should be held for manual review and additional verification.";


        actionCard.className =
            "action-card high-action";
    }


    // MEDIUM risk

    else if (riskLevel === "MEDIUM") {

        actionIcon.textContent =
            "⚠️";


        actionDescription.textContent =
            "Additional verification is recommended before completing the transaction.";


        actionCard.className =
            "action-card medium-action";
    }


    // LOW risk

    else {

        actionIcon.textContent =
            "✅";


        actionDescription.textContent =
            "Transaction can proceed while continuing normal risk monitoring.";


        actionCard.className =
            "action-card low-action";
    }
}


/* ==========================================
   Risk Level Color
========================================== */

function getRiskColor(level) {

    if (level === "HIGH") {
        return "var(--danger)";
    }


    if (level === "MEDIUM") {
        return "var(--warning)";
    }


    return "var(--success)";
}


/* ==========================================
   Escape HTML
========================================== */

function escapeHtml(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* ==========================================
   Load Model Metrics
========================================== */

async function loadMetrics() {

    try {

        const response =
            await fetch("/api/metrics");


        if (!response.ok) {

            throw new Error(
                "Unable to load model metrics"
            );
        }


        const data =
            await response.json();


        const performance =
            data.performance;

        const matrix =
            data.confusion_matrix;


        // Performance metrics

        document.getElementById(
            "metricAccuracy"
        ).textContent =
            `${(performance.accuracy * 100).toFixed(2)}%`;


        document.getElementById(
            "metricPrecision"
        ).textContent =
            `${(performance.precision * 100).toFixed(2)}%`;


        document.getElementById(
            "metricRecall"
        ).textContent =
            `${(performance.recall * 100).toFixed(2)}%`;


        document.getElementById(
            "metricF1"
        ).textContent =
            `${(performance.f1_score * 100).toFixed(2)}%`;


        // Confusion matrix

        document.getElementById(
            "trueNegative"
        ).textContent =
            matrix.true_negatives;


        document.getElementById(
            "falsePositive"
        ).textContent =
            matrix.false_positives;


        document.getElementById(
            "falseNegative"
        ).textContent =
            matrix.false_negatives;


        document.getElementById(
            "truePositive"
        ).textContent =
            matrix.true_positives;


        // False positive rate

        document.getElementById(
            "falsePositiveRate"
        ).textContent =
            `${(data.false_positive_rate * 100).toFixed(2)}%`;


        // Decision threshold

        document.getElementById(
            "modelThreshold"
        ).textContent =
            data.threshold.toFixed(2);


        // Top risk signals

        renderRiskSignals(
            data.top_risk_signals
        );

    }


    catch (error) {

        console.error(
            "Metrics loading error:",
            error
        );


        const riskSignals =
            document.getElementById(
                "riskSignals"
            );


        if (riskSignals) {

            riskSignals.innerHTML = `
                <div class="empty-state">
                    Unable to load model insights.
                </div>
            `;
        }
    }
}


/* ==========================================
   Render Top Risk Signals
========================================== */

function renderRiskSignals(signals) {

    const container =
        document.getElementById(
            "riskSignals"
        );


    if (!container) {
        return;
    }


    if (
        !signals ||
        signals.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                No risk signals available.
            </div>
        `;

        return;
    }


    const maxImportance =
        Math.max(
            ...signals.map(
                signal =>
                    signal.importance
            )
        );


    container.innerHTML =
        signals.map(signal => {

            const percentage =
                (
                    signal.importance /
                    maxImportance
                ) * 100;


            const displayName =
                formatFeatureName(
                    signal.feature
                );


            return `

                <div class="signal-row">

                    <span class="signal-name">
                        ${escapeHtml(displayName)}
                    </span>


                    <div class="signal-track">

                        <div
                            class="signal-fill"
                            style="width: ${percentage}%">
                        </div>

                    </div>


                    <span class="signal-value">
                        ${(signal.importance * 100).toFixed(1)}%
                    </span>

                </div>

            `;

        }).join("");
}


/* ==========================================
   Format Feature Names
========================================== */

function formatFeatureName(feature) {

    const names = {

        previous_chargebacks:
            "Previous Chargebacks",

        location_mismatch:
            "Location Mismatch",

        amount:
            "Transaction Amount",

        account_age_days:
            "Account Age",

        device_changes_30d:
            "Device Changes",

        transactions_24h:
            "Transactions (24h)",

        failed_transactions_24h:
            "Failed Transactions (24h)",

        international_transaction:
            "International Transaction"
    };


    return names[feature] ||
        feature;
}


/* ==========================================
   Transaction Audit Trail
========================================== */

async function loadAuditTrail() {

    try {

        const response =
            await fetch("/api/audit");


        if (!response.ok) {

            throw new Error(
                "Unable to load audit trail"
            );
        }


        const data =
            await response.json();


        const records =
            data.records || [];


        // Update dashboard statistics

        updateDashboardStats(
            records
        );

        // Update recent activity trend from the same audit data

        renderRiskTrend(records);


        const tableBody =
            document.getElementById(
                "auditTableBody"
            );


        const auditCount =
            document.getElementById(
                "auditCount"
            );


        if (
            !tableBody ||
            !auditCount
        ) {

            console.warn(
                "Audit Trail elements not found."
            );

            return;
        }


        // Update transaction count

        auditCount.textContent =
            `${data.count} Transaction${data.count === 1 ? "" : "s"}`;


        // Empty state

        if (records.length === 0) {

            tableBody.innerHTML = `

                <tr>

                    <td colspan="6">

                        <div class="empty-state">
                            No transactions analyzed yet.
                        </div>

                    </td>

                </tr>

            `;

            return;
        }


        // Render audit records

        tableBody.innerHTML =
            records.map(record => {

                const score =
                    Number(
                        record.risk_score
                    );


                const riskLevel =
                    escapeHtml(
                        record.risk_level
                    );


                const reasons =
                    record.reasons || [];


                const action =
                    escapeHtml(
                        record.recommended_action ||
                        "N/A"
                    );


                const transactionId =
                    escapeHtml(
                        record.transaction_id
                    );


                // Display first 2 risk factors

                const displayedReasons =
                    reasons.slice(0, 2);


                const reasonHTML =
                    displayedReasons
                        .map(reason => `

                            <span class="audit-factor">
                                ${escapeHtml(reason)}
                            </span>

                        `)
                        .join("");


                const extraReasons =
                    reasons.length -
                    displayedReasons.length;


                const extraHTML =
                    extraReasons > 0

                        ? `<span class="audit-more">
                            +${extraReasons} more
                          </span>`

                        : "";


                return `

                    <tr>

                        <td>

                            <span class="transaction-id">
                                ${transactionId}
                            </span>

                        </td>


                        <td>

                            <div class="audit-score">

                                <strong>
                                    ${score.toFixed(2)}
                                </strong>

                                <span>
                                    /100
                                </span>

                            </div>

                        </td>


                        <td>

                            <span class="risk-badge ${getRiskBadgeClass(riskLevel)}">
                                ${riskLevel}
                            </span>

                        </td>


                        <td>

                            <div class="audit-factors">

                                ${reasonHTML}

                                ${extraHTML}

                            </div>

                        </td>


                        <td>

                            <span class="audit-action ${getActionClass(riskLevel)}">
                                ${action}
                            </span>

                        </td>

                    </tr>

                `;

            }).join("");

    }


    catch (error) {

        console.error(
            "Audit Trail loading error:",
            error
        );


        const tableBody =
            document.getElementById(
                "auditTableBody"
            );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td colspan="6">

                        <div class="empty-state">
                            Unable to load transaction audit trail.
                        </div>

                    </td>

                </tr>

            `;
        }
    }
}


/* ==========================================
   Real-Time Dashboard Statistics
========================================== */

function updateDashboardStats(records) {

    const totalTransactions =
        document.getElementById(
            "totalTransactions"
        );


    const highRiskCount =
        document.getElementById(
            "highRiskCount"
        );


    const mediumRiskCount =
        document.getElementById(
            "mediumRiskCount"
        );


    const lowRiskCount =
        document.getElementById(
            "lowRiskCount"
        );


    if (
        !totalTransactions ||
        !highRiskCount ||
        !mediumRiskCount ||
        !lowRiskCount
    ) {

        console.warn(
            "Dashboard statistics elements not found."
        );

        return;
    }


    // Total transactions

    totalTransactions.textContent =
        records.length;


    // Count HIGH risk

    const highCount =
        records.filter(
            record =>
                record.risk_level === "HIGH"
        ).length;


    // Count MEDIUM risk

    const mediumCount =
        records.filter(
            record =>
                record.risk_level === "MEDIUM"
        ).length;


    // Count LOW risk

    const lowCount =
        records.filter(
            record =>
                record.risk_level === "LOW"
        ).length;


    // Update dashboard

    highRiskCount.textContent =
        highCount;

    mediumRiskCount.textContent =
        mediumCount;

    lowRiskCount.textContent =
        lowCount;

// Update Risk Distribution Chart
updateRiskDistribution(records);
}

/* ==========================================
   Risk Distribution Chart
========================================== */

function updateRiskDistribution(records) {

    const total =
        records.length;

    const highCount =
        records.filter(
            record => record.risk_level === "HIGH"
        ).length;

    const mediumCount =
        records.filter(
            record => record.risk_level === "MEDIUM"
        ).length;

    const lowCount =
        records.filter(
            record => record.risk_level === "LOW"
        ).length;


    // Calculate percentages

    const highPercent =
        total > 0
            ? (highCount / total) * 100
            : 0;

    const mediumPercent =
        total > 0
            ? (mediumCount / total) * 100
            : 0;

    const lowPercent =
        total > 0
            ? (lowCount / total) * 100
            : 0;


    // Update center total

    const distributionTotal =
        document.getElementById(
            "distributionTotal"
        );

    if (distributionTotal) {
        distributionTotal.textContent = total;
    }


    // Update counts

    const distributionHigh =
        document.getElementById(
            "distributionHigh"
        );

    const distributionMedium =
        document.getElementById(
            "distributionMedium"
        );

    const distributionLow =
        document.getElementById(
            "distributionLow"
        );


    if (distributionHigh) {
        distributionHigh.textContent =
            highCount;
    }

    if (distributionMedium) {
        distributionMedium.textContent =
            mediumCount;
    }

    if (distributionLow) {
        distributionLow.textContent =
            lowCount;
    }


    // Update percentages

    const highPercentElement =
        document.getElementById(
            "distributionHighPercent"
        );

    const mediumPercentElement =
        document.getElementById(
            "distributionMediumPercent"
        );

    const lowPercentElement =
        document.getElementById(
            "distributionLowPercent"
        );


    if (highPercentElement) {
        highPercentElement.textContent =
            `${highPercent.toFixed(1)}%`;
    }

    if (mediumPercentElement) {
        mediumPercentElement.textContent =
            `${mediumPercent.toFixed(1)}%`;
    }

    if (lowPercentElement) {
        lowPercentElement.textContent =
            `${lowPercent.toFixed(1)}%`;
    }


    // Update donut chart

    const donut =
        document.getElementById(
            "riskDonut"
        );


    if (!donut) {
        return;
    }


    if (total === 0) {

        donut.style.background =
            "#e8eaf0";

        return;
    }


    const highEnd =
        highPercent;

    const mediumEnd =
        highPercent +
        mediumPercent;


    donut.style.background =
        `conic-gradient(
            #dc2626 0% ${highEnd}%,
            #d97706 ${highEnd}% ${mediumEnd}%,
            #16a34a ${mediumEnd}% 100%
        )`;
}


/* ==========================================
   Risk Badge Classes
========================================== */

function getRiskBadgeClass(level) {

    if (level === "HIGH") {
        return "risk-high";
    }


    if (level === "MEDIUM") {
        return "risk-medium";
    }


    return "risk-low";
}


/* ==========================================
   Action Classes
========================================== */

function getActionClass(level) {

    if (level === "HIGH") {
        return "action-high";
    }


    if (level === "MEDIUM") {
        return "action-medium";
    }


    return "action-low";
}


/* ==========================================
   Initial Dashboard Loading
========================================== */

// Load model metrics

loadMetrics();


// Load audit trail + dashboard statistics

loadAuditTrail();
function openTransactionDetails(record) {
    const modal = document.getElementById("transactionModal");

    const transaction = record.transaction || {};

    document.getElementById("modalTransactionId").textContent =
        record.transaction_id || "Transaction";

    document.getElementById("modalRiskScore").textContent =
        Number(record.risk_score || 0).toFixed(2);

    document.getElementById("modalRiskLevel").textContent =
        record.risk_level || "--";

    document.getElementById("modalRiskProbability").textContent =
        `${(Number(record.risk_probability || 0) * 100).toFixed(2)}% probability`;

    document.getElementById("modalAmount").textContent =
        `₹${Number(transaction.amount || 0).toFixed(2)}`;

    document.getElementById("modalAccountAge").textContent =
        `${transaction.account_age_days ?? 0} days`;

    document.getElementById("modalTransactions").textContent =
        transaction.transactions_24h ?? 0;

    document.getElementById("modalFailedTransactions").textContent =
        transaction.failed_transactions_24h ?? 0;

    document.getElementById("modalDeviceChanges").textContent =
        transaction.device_changes_30d ?? 0;

    document.getElementById("modalChargebacks").textContent =
        transaction.previous_chargebacks ?? 0;

    document.getElementById("modalLocationMismatch").textContent =
        transaction.location_mismatch ? "Detected" : "None";

    document.getElementById("modalInternational").textContent =
        transaction.international_transaction ? "Yes" : "No";

    const factors = record.reasons || [];
    const factorContainer = document.getElementById("modalRiskFactors");

    document.getElementById("modalFactorCount").textContent =
        factors.length;

    if (factors.length === 0) {
        factorContainer.innerHTML =
            `<span class="empty-state">No major risk indicators detected.</span>`;
    } else {
        factorContainer.innerHTML = factors
            .map(reason => `
                <div class="modal-factor">
                    <span>!</span>
                    <span>${escapeHtml(reason)}</span>
                </div>
            `)
            .join("");
    }

    document.getElementById("modalRecommendedAction").textContent =
        record.recommended_action || "--";

    modal.classList.add("active");
}


function closeTransactionModal() {
    document.getElementById("transactionModal")
        .classList.remove("active");
}


document.getElementById("closeModal")
    ?.addEventListener("click", closeTransactionModal);


document.getElementById("transactionModal")
    ?.addEventListener("click", function(event) {
        if (event.target === this) {
            closeTransactionModal();
        }
    });


document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeTransactionModal();
    }
});

/* ==========================================
   Risk Activity Trend
========================================== */

function renderRiskTrend(records) {
    const chart = document.getElementById("riskTrendChart");
    const highestOutput = document.getElementById("trendHighestScore");
    const averageOutput = document.getElementById("trendAverageScore");
    const highAlertsOutput = document.getElementById("trendHighAlerts");

    if (!chart) return;

    if (!records || records.length === 0) {
        chart.innerHTML = `
            <div class="trend-empty">
                Analyze transactions to build the risk activity trend.
            </div>
        `;

        if (highestOutput) highestOutput.textContent = "--";
        if (averageOutput) averageOutput.textContent = "--";
        if (highAlertsOutput) highAlertsOutput.textContent = "0";
        return;
    }

    const recent = records.slice(0, 10).reverse();
    const scores = recent.map(record => Number(record.risk_score) || 0);
    const highest = Math.max(...scores);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highAlerts = recent.filter(record => record.risk_level === "HIGH").length;

    if (highestOutput) highestOutput.textContent = highest.toFixed(2);
    if (averageOutput) averageOutput.textContent = average.toFixed(2);
    if (highAlertsOutput) highAlertsOutput.textContent = highAlerts;

    chart.innerHTML = recent.map(record => {
        const score = Math.max(0, Math.min(100, Number(record.risk_score) || 0));
        const level = record.risk_level || "LOW";
        const levelClass = level === "HIGH" ? "trend-high" : level === "MEDIUM" ? "trend-medium" : "trend-low";
        const id = escapeHtml(record.transaction_id || "TXN");

        return `
            <div class="trend-column" title="${id} • ${score.toFixed(2)}/100 • ${escapeHtml(level)}">
                <div class="trend-value">${score.toFixed(0)}</div>
                <div class="trend-bar-area">
                    <div class="trend-bar ${levelClass}" style="height: ${Math.max(score, 4)}%"></div>
                </div>
                <span class="trend-label">${id.replace("TXN-", "#")}</span>
            </div>
        `;
    }).join("");
}


/* ==========================================
   False-Positive Cost Simulator
========================================== */

function updateFalsePositiveCostSimulator() {
    const totalInput = document.getElementById("simTotalTransactions");
    const fprInput = document.getElementById("simFpr");
    const reviewCostInput = document.getElementById("simReviewCost");
    const customerCostInput = document.getElementById("simCustomerCost");

    const falsePositiveOutput = document.getElementById("estimatedFalsePositives");
    const reviewCostOutput = document.getElementById("estimatedReviewCost");
    const customerCostOutput = document.getElementById("estimatedCustomerCost");
    const totalCostOutput = document.getElementById("estimatedTotalCost");

    if (!totalInput || !fprInput || !reviewCostInput || !customerCostInput ||
        !falsePositiveOutput || !reviewCostOutput || !customerCostOutput || !totalCostOutput) {
        return;
    }

    const totalTransactions = Math.max(0, Number(totalInput.value) || 0);
    const fpr = Math.min(100, Math.max(0, Number(fprInput.value) || 0));
    const reviewCost = Math.max(0, Number(reviewCostInput.value) || 0);
    const customerCost = Math.max(0, Number(customerCostInput.value) || 0);

    const estimatedFalsePositives = totalTransactions * (fpr / 100);
    const estimatedReviewCost = estimatedFalsePositives * reviewCost;
    const estimatedCustomerCost = estimatedFalsePositives * customerCost;
    const estimatedTotalCost = estimatedReviewCost + estimatedCustomerCost;

    falsePositiveOutput.textContent = Math.round(estimatedFalsePositives).toLocaleString("en-IN");
    reviewCostOutput.textContent = `₹${Math.round(estimatedReviewCost).toLocaleString("en-IN")}`;
    customerCostOutput.textContent = `₹${Math.round(estimatedCustomerCost).toLocaleString("en-IN")}`;
    totalCostOutput.textContent = `₹${Math.round(estimatedTotalCost).toLocaleString("en-IN")}`;
}

function initializeFalsePositiveCostSimulator() {
    ["simTotalTransactions", "simFpr", "simReviewCost", "simCustomerCost"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", updateFalsePositiveCostSimulator);
    });

    updateFalsePositiveCostSimulator();
}

initializeFalsePositiveCostSimulator();


/* ==========================================
   Sidebar Navigation
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item[data-target]");

    navItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();

            const targetId = item.dataset.target;
            const target = document.getElementById(targetId);

            if (!target) {
                return;
            }

            navItems.forEach((nav) => nav.classList.remove("active"));
            item.classList.add("active");

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            history.replaceState(null, "", `#${targetId}`);
        });
    });

    // Keep the active sidebar item in sync while scrolling.
    const sections = [...navItems]
        .map((item) => document.getElementById(item.dataset.target))
        .filter(Boolean);

    const syncActiveNav = () => {
        const scrollPosition = window.scrollY + 180;
        let current = sections[0];

        sections.forEach((section) => {
            if (section.offsetTop <= scrollPosition) {
                current = section;
            }
        });

        navItems.forEach((item) => {
            item.classList.toggle(
                "active",
                item.dataset.target === current.id
            );
        });
    };

    window.addEventListener("scroll", syncActiveNav, { passive: true });
    syncActiveNav();

    // Open the requested section if a hash is already present.
    const hash = window.location.hash.replace("#", "");
    if (hash) {
        const target = document.getElementById(hash);
        const item = document.querySelector(
            `.nav-item[data-target="${hash}"]`
        );

        if (target && item) {
            navItems.forEach((nav) => nav.classList.remove("active"));
            item.classList.add("active");

            setTimeout(() => {
                target.scrollIntoView({
                    behavior: "auto",
                    block: "start"
                });
            }, 50);
        }
    }
});

