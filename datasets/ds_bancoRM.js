function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CPODIGO");
    dataset.addColumn("NOME");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        // Retorna todos os bancos com código BCB e nome
        var sql =
            "SELECT CPODIGO, NOME " +
            "FROM GBANCO " +
            "ORDER BY NOME";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("CPODIGO"),
                rs.getString("NOME")
            ]);
        }

    } catch (e) {
        dataset.addRow(["ERRO", e.toString()]);

    } finally {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (e) {
            dataset.addRow(["ERRO_CLOSE", e.toString()]);
        }
    }

    return dataset;
}
