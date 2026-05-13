function defineStructure() {

}
function onSync(lastSyncDate) {

}
function createDataset(fields, constraints, sortFields) {
	  log.erro("entrou no dataset");

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
	        log.erro("Executing query: " + selectQuery);
	        rs = stmt.executeQuery(selectQuery);

	        var metaData = rs.getMetaData();
	        var columnCount = metaData.getColumnCount();

	        if (columnCount > 0) {
	            for (var i = 1; i <= columnCount; i++) {
	                newDataset.addColumn(metaData.getColumnName(i));
	            }
	            log.erro("Column names added to dataset");

	            while (rs.next()) {
	                var arr = [];
	                for (var i = 1; i <= columnCount; i++) {
	                    var obj = rs.getObject(i);
	                    arr.push(obj !== null ? obj.toString() : "null");
	                }
	                newDataset.addRow(arr);
	            }
	        } else {
	            log.erro("No columns found in result set");
	        }
	    } catch (erro) {
	        log.erro("Error occurred: " + erro.message);
	    } finally {
	        try {
	            if (rs != null) rs.close();
	            if (stmt != null) stmt.close();
	            if (conn != null) conn.close();
	        } catch (erro) {
	            log.erro("Error closing resources: " + erro.message);
	        }
	    }

	    log.erro("Dataset created: " + newDataset);
	    return newDataset;
	
}function onMobileSync(user) {

}