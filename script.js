document.addEventListener("DOMContentLoaded", () => {
    const gameContainer = document.getElementById("game-container");
    const datePicker = document.getElementById("date-picker");
    const prevDayBtn = document.getElementById("prev-day-btn");
    const nextDayBtn = document.getElementById("next-day-btn");
    const todayBtn = document.getElementById("today-btn");
    const teamSelect = document.getElementById("team-select");
    const viewScheduleBtn = document.getElementById("view-schedule-btn");
    const backToDailyBtn = document.getElementById("back-to-daily-btn");
    const currentViewTitle = document.getElementById("current-view-title");

    let currentDate = new Date();
    let selectedTeamId = "all";
    let allTeams = [];
    let isScheduleView = false;

    // Standard list of all 32 NHL teams as fallback
    const fallbackTeams = [
        { id: "25", abbreviation: "ANA", displayName: "Anaheim Ducks" },
        { id: "1", abbreviation: "BOS", displayName: "Boston Bruins" },
        { id: "2", abbreviation: "BUF", displayName: "Buffalo Sabres" },
        { id: "3", abbreviation: "CGY", displayName: "Calgary Flames" },
        { id: "7", abbreviation: "CAR", displayName: "Carolina Hurricanes" },
        { id: "4", abbreviation: "CHI", displayName: "Chicago Blackhawks" },
        { id: "17", abbreviation: "COL", displayName: "Colorado Avalanche" },
        { id: "29", abbreviation: "CBJ", displayName: "Columbus Blue Jackets" },
        { id: "6", abbreviation: "DAL", displayName: "Dallas Stars" },
        { id: "5", abbreviation: "DET", displayName: "Detroit Red Wings" },
        { id: "22", abbreviation: "EDM", displayName: "Edmonton Oilers" },
        { id: "26", abbreviation: "FLA", displayName: "Florida Panthers" },
        { id: "8", abbreviation: "LAK", displayName: "Los Angeles Kings" },
        { id: "30", abbreviation: "MIN", displayName: "Minnesota Wild" },
        { id: "10", abbreviation: "MTL", displayName: "Montreal Canadiens" },
        { id: "27", abbreviation: "NSH", displayName: "Nashville Predators" },
        { id: "11", abbreviation: "NJD", displayName: "New Jersey Devils" },
        { id: "12", abbreviation: "NYI", displayName: "New York Islanders" },
        { id: "13", abbreviation: "NYR", displayName: "New York Rangers" },
        { id: "14", abbreviation: "OTT", displayName: "Ottawa Senators" },
        { id: "15", abbreviation: "PHI", displayName: "Philadelphia Flyers" },
        { id: "16", abbreviation: "PIT", displayName: "Pittsburgh Penguins" },
        { id: "18", abbreviation: "SJS", displayName: "San Jose Sharks" },
        { id: "32", abbreviation: "SEA", displayName: "Seattle Kraken" },
        { id: "19", abbreviation: "STL", displayName: "St. Louis Blues" },
        { id: "20", abbreviation: "TBL", displayName: "Tampa Bay Lightning" },
        { id: "21", abbreviation: "TOR", displayName: "Toronto Maple Leafs" },
        { id: "33", abbreviation: "UTA", displayName: "Utah Hockey Club" },
        { id: "23", abbreviation: "VAN", displayName: "Vancouver Canucks" },
        { id: "31", abbreviation: "VGK", displayName: "Vegas Golden Knights" },
        { id: "24", abbreviation: "WSH", displayName: "Washington Capitals" },
        { id: "28", abbreviation: "WPG", displayName: "Winnipeg Jets" }
    ];

    const formatDateForPicker = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const formatDateForApi = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}${m}${d}`;
    };

    const formatFriendlyDate = (date) => {
        const today = new Date();
        const isToday = today.toDateString() === date.toDateString();
        const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
        const formatted = date.toLocaleDateString(undefined, options);
        return isToday ? `Today: ${formatted}` : formatted;
    };

    const parseLocalDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const updateDatePicker = () => {
        datePicker.value = formatDateForPicker(currentDate);
    };

    // Populate Teams Dropdown
    const initTeams = async () => {
        try {
            const resp = await fetch("https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams");
            if (resp.ok) {
                const data = await resp.json();
                const rawTeams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
                allTeams = rawTeams.map(t => ({
                    id: t.team.id,
                    abbreviation: t.team.abbreviation,
                    displayName: t.team.displayName || t.team.name,
                    logo: t.team.logos?.[0]?.href || t.team.logo
                })).sort((a, b) => a.displayName.localeCompare(b.displayName));
            }
        } catch (e) {
            console.warn("Could not fetch teams from API, using fallback list:", e);
        }

        if (!allTeams || allTeams.length === 0) {
            allTeams = fallbackTeams.sort((a, b) => a.displayName.localeCompare(b.displayName));
        }

        // Populate dropdown
        teamSelect.innerHTML = `<option value="all">All Teams (32)</option>`;
        allTeams.forEach(team => {
            const opt = document.createElement("option");
            opt.value = team.id;
            opt.textContent = team.displayName;
            teamSelect.appendChild(opt);
        });
    };

    // Fetch and render games for a date
    const fetchGames = async () => {
        isScheduleView = false;
        backToDailyBtn.style.display = "none";
        
        const dateStr = formatDateForApi(currentDate);
        const friendlyDate = formatFriendlyDate(currentDate);
        currentViewTitle.textContent = friendlyDate;
        updateDatePicker();

        gameContainer.innerHTML = `<div class="loading">Loading games for ${friendlyDate}...</div>`;

        const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=${dateStr}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const data = await response.json();
            const rawEvents = data.events || [];

            renderGames(rawEvents);
        } catch (error) {
            console.error("Error fetching game data:", error);
            gameContainer.innerHTML = `<div class="empty-state"><p>Could not retrieve game data. The NHL scoreboard service may be unavailable.</p></div>`;
        }
    };

    const renderGames = (events) => {
        gameContainer.innerHTML = "";

        let filteredEvents = events;
        if (selectedTeamId !== "all") {
            filteredEvents = events.filter(event => {
                const competitors = event.competitions?.[0]?.competitors || [];
                return competitors.some(c => c.team.id === selectedTeamId || c.team.abbreviation === selectedTeamId);
            });
        }

        if (filteredEvents.length === 0) {
            const teamObj = allTeams.find(t => t.id === selectedTeamId);
            if (selectedTeamId !== "all" && teamObj) {
                gameContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No games scheduled for the <strong>${teamObj.displayName}</strong> on this date.</p>
                        <button id="card-schedule-btn" class="nav-btn action-btn">View ${teamObj.displayName} Season Schedule</button>
                    </div>
                `;
                document.getElementById("card-schedule-btn")?.addEventListener("click", () => {
                    fetchTeamSchedule(selectedTeamId);
                });
            } else {
                gameContainer.innerHTML = `
                    <div class="empty-state">
                        <p>No NHL games scheduled for this date.</p>
                    </div>
                `;
            }
            return;
        }

        filteredEvents.forEach(event => {
            const competition = event.competitions[0];
            const status = event.status?.type || {};
            const homeCompetitor = competition.competitors.find(c => c.homeAway === "home") || competition.competitors[0];
            const awayCompetitor = competition.competitors.find(c => c.homeAway === "away") || competition.competitors[1];

            const homeTeam = homeCompetitor.team;
            const awayTeam = awayCompetitor.team;

            const homeRecord = (homeCompetitor.records || [{ summary: "" }])[0]?.summary || "";
            const awayRecord = (awayCompetitor.records || [{ summary: "" }])[0]?.summary || "";

            const isLive = status.state === "in";
            const isCompleted = status.completed || status.state === "post";
            const hasScores = (isLive || isCompleted) && homeCompetitor.score !== undefined && awayCompetitor.score !== undefined;

            const statusText = status.shortDetail || status.detail || "Scheduled";
            const gameTimeStr = new Date(event.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

            // Broadcast info
            let broadcastInfo = "N/A";
            if (competition.broadcasts && competition.broadcasts.length > 0) {
                const names = competition.broadcasts.map(b => b.names ? b.names.join(", ") : b.name).filter(Boolean);
                if (names.length > 0) broadcastInfo = names.join(" | ");
            }

            // Odds info
            let analysis = "No betting line available.";
            let favoredTeamAbbr = "";
            if (competition.odds && competition.odds[0]?.details) {
                analysis = `Line: ${competition.odds[0].details}`;
                favoredTeamAbbr = competition.odds[0].details.split(" ")[0];
            }

            const isAwayFavored = favoredTeamAbbr && (awayTeam.abbreviation === favoredTeamAbbr);
            const isHomeFavored = favoredTeamAbbr && (homeTeam.abbreviation === favoredTeamAbbr);

            const card = document.createElement("div");
            card.className = "game-card";
            card.innerHTML = `
                <div class="game-header-bar">
                    <span class="status-badge ${isLive ? "live" : (isCompleted ? "final" : "")}">${statusText}</span>
                    <span class="game-time">${gameTimeStr}</span>
                </div>

                <div class="teams">
                    <div class="team">
                        <img src="${awayTeam.logo || "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png"}" alt="${awayTeam.displayName || awayTeam.name}" class="team-logo" loading="lazy" onerror="this.src='https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png'">
                        <span class="team-name">${awayTeam.displayName || awayTeam.name}</span>
                        ${awayRecord ? `<span class="team-record">${awayRecord}</span>` : ""}
                        ${hasScores ? `<span class="team-score">${awayCompetitor.score}</span>` : ""}
                        ${isAwayFavored ? `<span class="favored-badge">Favored</span>` : ""}
                    </div>

                    <div class="vs-container">
                        <span class="vs-text">${hasScores ? "vs" : "@"}</span>
                    </div>

                    <div class="team">
                        <img src="${homeTeam.logo || "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png"}" alt="${homeTeam.displayName || homeTeam.name}" class="team-logo" loading="lazy" onerror="this.src='https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png'">
                        <span class="team-name">${homeTeam.displayName || homeTeam.name}</span>
                        ${homeRecord ? `<span class="team-record">${homeRecord}</span>` : ""}
                        ${hasScores ? `<span class="team-score">${homeCompetitor.score}</span>` : ""}
                        ${isHomeFavored ? `<span class="favored-badge">Favored</span>` : ""}
                    </div>
                </div>

                <div class="meta-row">
                    <div class="meta-item">
                        <span class="meta-label">Broadcast:</span>
                        <span class="broadcast-pill">${broadcastInfo}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Analysis:</span>
                        <span class="meta-value">${analysis}</span>
                    </div>
                </div>
            `;
            gameContainer.appendChild(card);
        });
    };

    // Fetch and render full season schedule for a team
    const fetchTeamSchedule = async (teamId) => {
        const teamObj = allTeams.find(t => t.id === teamId);
        const teamName = teamObj ? teamObj.displayName : "Team";

        isScheduleView = true;
        backToDailyBtn.style.display = "inline-flex";
        currentViewTitle.textContent = `${teamName} Schedule`;

        gameContainer.innerHTML = `<div class="loading">Loading ${teamName} schedule...</div>`;

        try {
            const resp = await fetch(`https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/schedule`);
            if (!resp.ok) throw new Error(`Schedule fetch failed: ${resp.status}`);
            const data = await resp.json();
            const events = data.events || [];

            renderTeamSchedule(events, teamId, teamName);
        } catch (e) {
            console.error("Error fetching team schedule:", e);
            gameContainer.innerHTML = `<div class="empty-state"><p>Could not retrieve schedule for ${teamName}.</p></div>`;
        }
    };

    const renderTeamSchedule = (events, teamId, teamName) => {
        gameContainer.innerHTML = "";

        if (events.length === 0) {
            gameContainer.innerHTML = `<div class="empty-state"><p>No schedule records found for ${teamName}.</p></div>`;
            return;
        }

        const scheduleCard = document.createElement("div");
        scheduleCard.className = "game-card";

        let html = `
            <div class="game-header-bar">
                <span class="current-view-title" style="font-size: 1.1rem;">Upcoming & Recent Games</span>
                <span class="status-badge">${events.length} Games</span>
            </div>
            <div class="schedule-list">
        `;

        events.forEach(ev => {
            const comp = ev.competitions?.[0];
            const competitors = comp?.competitors || [];
            const myTeam = competitors.find(c => c.id === teamId || c.team?.id === teamId) || competitors[0];
            const oppTeam = competitors.find(c => c.id !== teamId && c.team?.id !== teamId) || competitors[1];

            const isHome = myTeam?.homeAway === "home";
            const oppName = oppTeam?.team?.displayName || oppTeam?.team?.name || "Opponent";
            const oppLogo = oppTeam?.team?.logos?.[0]?.href || oppTeam?.team?.logo || "";

            const status = ev.status?.type || {};
            const isCompleted = status.completed;
            const gameDate = new Date(ev.date);
            const dateStr = gameDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
            const timeStr = gameDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

            let resultStr = "";
            if (isCompleted) {
                const myScore = myTeam?.score;
                const oppScore = oppTeam?.score;
                const won = parseInt(myScore, 10) > parseInt(oppScore, 10);
                resultStr = `<span style="color: ${won ? "var(--live-color)" : "#ff5252"}">${won ? "W" : "L"} ${myScore}-${oppScore}</span>`;
            } else {
                resultStr = `<span style="color: var(--accent-color)">${timeStr}</span>`;
            }

            html += `
                <div class="schedule-row">
                    <span class="schedule-date">${dateStr}</span>
                    <div class="schedule-matchup">
                        <span>${isHome ? "vs" : "@"}</span>
                        ${oppLogo ? `<img src="${oppLogo}" class="schedule-logo" alt="${oppName}" onerror="this.style.display=none">` : ""}
                        <span>${oppName}</span>
                    </div>
                    <div class="schedule-outcome">${resultStr}</div>
                </div>
            `;
        });

        html += `</div>`;
        scheduleCard.innerHTML = html;
        gameContainer.appendChild(scheduleCard);
    };

    // Event Listeners
    prevDayBtn.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() - 1);
        fetchGames();
    });

    nextDayBtn.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() + 1);
        fetchGames();
    });

    todayBtn.addEventListener("click", () => {
        currentDate = new Date();
        fetchGames();
    });

    datePicker.addEventListener("change", (e) => {
        if (e.target.value) {
            currentDate = parseLocalDate(e.target.value);
            fetchGames();
        }
    });

    teamSelect.addEventListener("change", (e) => {
        selectedTeamId = e.target.value;
        if (selectedTeamId === "all") {
            viewScheduleBtn.style.display = "none";
            if (isScheduleView) {
                fetchGames();
            } else {
                fetchGames();
            }
        } else {
            viewScheduleBtn.style.display = "inline-flex";
            if (isScheduleView) {
                fetchTeamSchedule(selectedTeamId);
            } else {
                fetchGames();
            }
        }
    });

    viewScheduleBtn.addEventListener("click", () => {
        if (selectedTeamId !== "all") {
            fetchTeamSchedule(selectedTeamId);
        }
    });

    backToDailyBtn.addEventListener("click", () => {
        fetchGames();
    });

    // Boot
    initTeams().then(() => {
        fetchGames();
    });
});
