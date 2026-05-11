function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
	  log.error("entrou no dataset");

	    var newDataset = DatasetBuilder.newDataset();

	    var selectQuery = "SELECT IDNATRENDIMENTO, CODNATRENDIMENTO, DESCRICAORENDIMENTO FROM DNATUREZARENDIMENTO ORDER BY CAST(IDNATRENDIMENTO AS INT)"
	    
	    var dataSource = "/jdbc/RM";
	    var ic = new javax.naming.InitialContext();
	    var ds = ic.lookup(dataSource);
	    var conn = null;
	    var stmt = null;
	    var rs = null;

	    try {
	        conn = ds.getConnection();
	        stmt = conn.createStatement();
	        log.error("Executing query: " + selectQuery);
	        rs = stmt.executeQuery(selectQuery);

	        var metaData = rs.getMetaData();
	        var columnCount = metaData.getColumnCount();

	        if (columnCount > 0) {
	            for (var i = 1; i <= columnCount; i++) {
	                newDataset.addColumn(metaData.getColumnName(i));
	            }
	            log.error("Column names added to dataset");

	            while (rs.next()) {
	                var arr = [];
	                for (var i = 1; i <= columnCount; i++) {
	                    var obj = rs.getObject(i);
	                    arr.push(obj !== null ? obj.toString() : "null");
	                }
	                newDataset.addRow(arr);
	            }
	        } else {
	            log.error("No columns found in result set");
	        }
	    } catch (error) {
	        log.error("Error occurred: " + error.message);
	    } finally {
	        try {
	            if (rs != null) rs.close();
	            if (stmt != null) stmt.close();
	            if (conn != null) conn.close();
	        } catch (error) {
	            log.error("Error closing resources: " + error.message);
	        }
	    }

	    log.error("Dataset created: " + newDataset);
	    return newDataset;
	
}function onMobileSync(user) {

}