<?php
/**
 * Script de test de connexion à la base de données
 * Vérifie que la connexion MySQL fonctionne correctement
 */

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'location_voiture');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test de Connexion - Location de Voitures</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f7fb;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2F9E44;
            margin-bottom: 20px;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .success {
            background: #DFF6EC;
            color: #2F9E44;
            border-left: 4px solid #2F9E44;
        }
        .error {
            background: #fee;
            color: #c33;
            border-left: 4px solid #c33;
        }
        .info {
            background: #eef;
            color: #334;
            border-left: 4px solid #41B883;
            padding: 10px;
            margin: 10px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2F9E44;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #2F9E44;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
        .btn:hover {
            background: #41B883;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Test de Connexion à la Base de Données</h1>
        
        <?php
        $errors = [];
        $success = [];
        
        // Test 1: Vérifier l'extension PDO
        echo '<div class="status ' . (extension_loaded('pdo') && extension_loaded('pdo_mysql') ? 'success' : 'error') . '">';
        if (extension_loaded('pdo') && extension_loaded('pdo_mysql')) {
            echo '✅ Extension PDO MySQL est chargée';
            $success[] = 'PDO MySQL';
        } else {
            echo '❌ Extension PDO MySQL n\'est pas chargée';
            $errors[] = 'PDO MySQL';
        }
        echo '</div>';
        
        // Test 2: Connexion à MySQL
        try {
            $dsn = "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            echo '<div class="status success">';
            echo '✅ Connexion à MySQL réussie';
            echo '</div>';
            $success[] = 'Connexion MySQL';
            
            // Test 3: Vérifier si la base de données existe
            $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
            $dbExists = $stmt->rowCount() > 0;
            
            echo '<div class="status ' . ($dbExists ? 'success' : 'error') . '">';
            if ($dbExists) {
                echo '✅ Base de données <code>' . DB_NAME . '</code> existe';
                $success[] = 'Base de données';
            } else {
                echo '❌ Base de données <code>' . DB_NAME . '</code> n\'existe pas';
                echo '<div class="info">💡 Exécutez <code>database.sql</code> pour créer la base de données</div>';
                $errors[] = 'Base de données';
            }
            echo '</div>';
            
            // Test 4: Se connecter à la base de données
            if ($dbExists) {
                try {
                    $dsn_db = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                    $pdo_db = new PDO($dsn_db, DB_USER, DB_PASS);
                    $pdo_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                    
                    echo '<div class="status success">';
                    echo '✅ Connexion à la base de données <code>' . DB_NAME . '</code> réussie';
                    echo '</div>';
                    $success[] = 'Connexion DB';
                    
                    // Test 5: Vérifier les tables
                    $stmt = $pdo_db->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    echo '<div class="status ' . (count($tables) > 0 ? 'success' : 'error') . '">';
                    if (count($tables) > 0) {
                        echo '✅ ' . count($tables) . ' table(s) trouvée(s): <code>' . implode('</code>, <code>', $tables) . '</code>';
                        $success[] = 'Tables';
                        
                        // Afficher les détails des tables
                        echo '<table>';
                        echo '<tr><th>Table</th><th>Lignes</th></tr>';
                        foreach ($tables as $table) {
                            $stmt = $pdo_db->query("SELECT COUNT(*) FROM `$table`");
                            $count = $stmt->fetchColumn();
                            echo '<tr><td><code>' . htmlspecialchars($table) . '</code></td><td>' . $count . '</td></tr>';
                        }
                        echo '</table>';
                    } else {
                        echo '❌ Aucune table trouvée';
                        echo '<div class="info">💡 Exécutez <code>database.sql</code> pour créer les tables</div>';
                        $errors[] = 'Tables';
                    }
                    echo '</div>';
                    
                    // Test 6: Vérifier les véhicules
                    if (in_array('vehicles', $tables)) {
                        $stmt = $pdo_db->query("SELECT COUNT(*) FROM vehicles");
                        $vehicleCount = $stmt->fetchColumn();
                        
                        echo '<div class="status ' . ($vehicleCount > 0 ? 'success' : 'info') . '">';
                        echo ($vehicleCount > 0 ? '✅' : 'ℹ️') . ' ' . $vehicleCount . ' véhicule(s) dans la base de données';
                        if ($vehicleCount == 0) {
                            echo '<div class="info">💡 Les données d\'exemple seront insérées automatiquement par le backend</div>';
                        }
                        echo '</div>';
                    }
                    
                } catch (PDOException $e) {
                    echo '<div class="status error">';
                    echo '❌ Erreur de connexion à la base de données: ' . htmlspecialchars($e->getMessage());
                    echo '</div>';
                    $errors[] = 'Connexion DB';
                }
            }
            
        } catch (PDOException $e) {
            echo '<div class="status error">';
            echo '❌ Erreur de connexion MySQL: ' . htmlspecialchars($e->getMessage());
            echo '</div>';
            $errors[] = 'Connexion MySQL';
        }
        
        // Résumé
        echo '<div class="status ' . (count($errors) == 0 ? 'success' : 'error') . '">';
        echo '<strong>Résumé:</strong><br>';
        echo '✅ Tests réussis: ' . count($success) . '<br>';
        if (count($errors) > 0) {
            echo '❌ Tests échoués: ' . count($errors) . ' (' . implode(', ', $errors) . ')';
        } else {
            echo '🎉 Tous les tests sont passés avec succès!';
        }
        echo '</div>';
        
        // Informations de configuration
        echo '<div class="info">';
        echo '<strong>Configuration actuelle:</strong><br>';
        echo 'Host: <code>' . DB_HOST . '</code><br>';
        echo 'Database: <code>' . DB_NAME . '</code><br>';
        echo 'User: <code>' . DB_USER . '</code><br>';
        echo 'Charset: <code>' . DB_CHARSET . '</code>';
        echo '</div>';
        ?>
        
        <div style="margin-top: 30px;">
            <a href="index.html" class="btn">Accéder à l'application</a>
            <a href="backend.php/vehicles" class="btn" style="margin-left: 10px;">Tester l'API</a>
        </div>
    </div>
</body>
</html>

